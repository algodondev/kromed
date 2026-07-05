import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type ReportType = "patient" | "financial" | "collaborator";

const reportLabels: Record<ReportType, string> = {
  patient: "Reporte por paciente",
  financial: "Reporte financiero",
  collaborator: "Reporte colaborador",
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonError("No autenticado.", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return jsonError(profileError.message, 500);
  }

  if (!profile?.active || profile.role !== "admin") {
    return jsonError("No autorizado para generar reportes.", 403);
  }

  const body = (await request.json()) as {
    reportType?: string;
    patientId?: string;
    collaboratorId?: string;
  };
  const reportType = body.reportType as ReportType;

  if (!["patient", "financial", "collaborator"].includes(reportType)) {
    return jsonError("Tipo de reporte no soportado.", 400);
  }

  const report = await buildReport({
    reportType,
    patientId: body.patientId,
    collaboratorId: body.collaboratorId,
    requestedBy: profile.display_name,
    supabase,
  });

  if (!report.ok) {
    return jsonError(report.error, report.status);
  }

  const webhookUrl = process.env.N8N_UI_REPORT_DELIVERY_WEBHOOK_URL;

  if (!webhookUrl) {
    return jsonError("N8N_UI_REPORT_DELIVERY_WEBHOOK_URL no está configurado.", 503);
  }

  const n8nResponse = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report.payload),
  });
  const n8nText = await n8nResponse.text();
  let n8nResult: unknown = n8nText;

  try {
    n8nResult = n8nText ? JSON.parse(n8nText) : null;
  } catch {
    n8nResult = n8nText;
  }

  if (!n8nResponse.ok) {
    return NextResponse.json(
      {
        error: "n8n no pudo entregar el reporte.",
        details: n8nResult,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    report: report.payload,
    n8n: n8nResult,
  });
}

async function buildReport({
  reportType,
  patientId,
  collaboratorId,
  requestedBy,
  supabase,
}: {
  reportType: ReportType;
  patientId?: string;
  collaboratorId?: string;
  requestedBy: string;
  supabase: ReturnType<typeof createClient>;
}): Promise<
  | {
      ok: true;
      payload: {
        reportType: ReportType;
        title: string;
        summary: string;
        requestedBy: string;
        metadata: Record<string, unknown>;
      };
    }
  | { ok: false; error: string; status: number }
> {
  if (reportType === "patient") {
    if (!patientId) {
      return { ok: false, error: "Selecciona un paciente.", status: 400 };
    }

    const [
      patientResult,
      visitsResult,
      notesResult,
      suppliesResult,
      assignmentsResult,
    ] = await Promise.all([
      supabase.from("patients").select("*").eq("id", patientId).maybeSingle(),
      supabase
        .from("visits")
        .select("*, collaborators(name, profession)")
        .eq("patient_id", patientId)
        .order("scheduled_start", { ascending: false }),
      supabase
        .from("visit_clinical_notes")
        .select("evolution_text, created_at, profiles(display_name), visits!inner(patient_id)")
        .eq("visits.patient_id", patientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("visit_supplies")
        .select("quantity, total_price_cents, inventory_items(name), visits!inner(patient_id)")
        .eq("visits.patient_id", patientId),
      supabase
        .from("patient_assignments")
        .select("collaborators(name, profession)")
        .eq("patient_id", patientId)
        .eq("active", true),
    ]);

    const error =
      patientResult.error ??
      visitsResult.error ??
      notesResult.error ??
      suppliesResult.error ??
      assignmentsResult.error;

    if (error) return { ok: false, error: error.message, status: 500 };
    if (!patientResult.data) {
      return { ok: false, error: "Paciente no encontrado.", status: 404 };
    }

    const visits = visitsResult.data ?? [];
    const notes = notesResult.data ?? [];
    const supplies = suppliesResult.data ?? [];
    const assignments = assignmentsResult.data ?? [];
    const supplyTotal = supplies.reduce(
      (sum, item) => sum + item.total_price_cents,
      0,
    );
    const lastVisit = visits[0];
    const latestNote = notes[0]?.evolution_text ?? "Sin evolución registrada.";
    const team = assignments
      .map((item) => firstRelation(item.collaborators)?.name)
      .filter(Boolean)
      .join(", ");

    return {
      ok: true,
      payload: {
        reportType,
        title: `${reportLabels.patient}: ${patientResult.data.full_name}`,
        summary: [
          `Visitas registradas: ${visits.length}.`,
          `Última visita: ${formatDate(lastVisit?.scheduled_start)} (${lastVisit?.status ?? "sin estado"}).`,
          `Evolución reciente: ${latestNote}`,
          `Insumos utilizados: ${supplies.length}, total ${formatMoney(supplyTotal)}.`,
          `Equipo asignado: ${team || "Sin equipo activo"}.`,
        ].join("\n"),
        requestedBy,
        metadata: { patientId, visitCount: visits.length, supplyTotal },
      },
    };
  }

  if (reportType === "financial") {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const [visitsResult, paymentsResult] = await Promise.all([
      supabase
        .from("visits")
        .select("status, patient_charge_cents, collaborator_payout_cents")
        .gte("scheduled_start", start.toISOString()),
      supabase
        .from("patient_payments")
        .select("amount_cents")
        .gte("received_at", start.toISOString()),
    ]);
    const error = visitsResult.error ?? paymentsResult.error;

    if (error) return { ok: false, error: error.message, status: 500 };

    const visits = visitsResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const patientCharge = visits.reduce(
      (sum, visit) => sum + visit.patient_charge_cents,
      0,
    );
    const collaboratorPayout = visits.reduce(
      (sum, visit) => sum + visit.collaborator_payout_cents,
      0,
    );
    const received = payments.reduce((sum, payment) => sum + payment.amount_cents, 0);

    return {
      ok: true,
      payload: {
        reportType,
        title: reportLabels.financial,
        summary: [
          `Periodo: desde ${formatDate(start.toISOString())}.`,
          `Visitas del mes: ${visits.length}.`,
          `Ingresos facturados: ${formatMoney(patientCharge)}.`,
          `Pagos recibidos: ${formatMoney(received)}.`,
          `Saldo pendiente estimado: ${formatMoney(Math.max(patientCharge - received, 0))}.`,
          `Pago generado a colaboradores: ${formatMoney(collaboratorPayout)}.`,
        ].join("\n"),
        requestedBy,
        metadata: { visitCount: visits.length, patientCharge, received, collaboratorPayout },
      },
    };
  }

  if (!collaboratorId) {
    return { ok: false, error: "Selecciona un colaborador.", status: 400 };
  }

  const [collaboratorResult, visitsResult, payoutResult] = await Promise.all([
    supabase.from("collaborators").select("*").eq("id", collaboratorId).maybeSingle(),
    supabase
      .from("visits")
      .select("id, patient_id, status, scheduled_start, patients(full_name)")
      .eq("collaborator_id", collaboratorId)
      .order("scheduled_start", { ascending: false }),
    supabase
      .from("payout_lines")
      .select("amount_cents, status")
      .eq("collaborator_id", collaboratorId),
  ]);
  const error = collaboratorResult.error ?? visitsResult.error ?? payoutResult.error;

  if (error) return { ok: false, error: error.message, status: 500 };
  if (!collaboratorResult.data) {
    return { ok: false, error: "Colaborador no encontrado.", status: 404 };
  }

  const visits = visitsResult.data ?? [];
  const payouts = payoutResult.data ?? [];
  const patientIds = new Set(visits.map((visit) => visit.patient_id));
  const payoutTotal = payouts.reduce((sum, line) => sum + line.amount_cents, 0);
  const completed = visits.filter((visit) =>
    ["completed", "pending_validation", "approved_for_payment"].includes(visit.status),
  ).length;

  return {
    ok: true,
    payload: {
      reportType,
      title: `${reportLabels.collaborator}: ${collaboratorResult.data.name}`,
      summary: [
        `Visitas asignadas: ${visits.length}.`,
        `Visitas realizadas o pendientes de validación: ${completed}.`,
        `Pacientes atendidos: ${patientIds.size}.`,
        `Pago generado: ${formatMoney(payoutTotal)}.`,
        `Última visita: ${formatDate(visits[0]?.scheduled_start)}.`,
      ].join("\n"),
      requestedBy,
      metadata: { collaboratorId, visitCount: visits.length, patientCount: patientIds.size, payoutTotal },
    },
  };
}
