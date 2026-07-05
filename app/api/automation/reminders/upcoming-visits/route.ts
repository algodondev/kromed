import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";

export async function GET(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const now = new Date();
  const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const { data, error } = await auth.supabase
    .from("visits")
    .select("id, scheduled_start, patients(full_name, contact_phone)")
    .in("status", ["scheduled", "confirmed"])
    .gte("scheduled_start", now.toISOString())
    .lte("scheduled_start", horizon.toISOString())
    .order("scheduled_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const visits = (data ?? []).map((visit) => {
    const startsAt = new Date(visit.scheduled_start);
    const hoursUntil = (startsAt.getTime() - now.getTime()) / 36e5;
    const window = hoursUntil <= 3 ? "2h" : "24h";
    const patient = Array.isArray(visit.patients)
      ? visit.patients[0]
      : visit.patients;
    const patientName = patient?.full_name ?? "Paciente";

    return {
      reminderId: `${visit.id}-${window}`,
      visitId: visit.id,
      patientName,
      patientPhone: patient?.contact_phone ?? null,
      startsAt: visit.scheduled_start,
      window,
      text: `Recordatorio Kromed: tiene una visita programada el ${startsAt.toLocaleString("es-SV")}.`,
    };
  });

  return NextResponse.json({ visits });
}
