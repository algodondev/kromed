import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";

export async function GET(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [visitsResult, paymentsResult, runsResult] = await Promise.all([
    auth.supabase
      .from("visits")
      .select("status, patient_charge_cents, collaborator_payout_cents")
      .gte("scheduled_start", start.toISOString()),
    auth.supabase
      .from("patient_payments")
      .select("amount_cents")
      .gte("received_at", start.toISOString()),
    auth.supabase
      .from("automation_runs")
      .select("status")
      .gte("created_at", start.toISOString()),
  ]);

  const error = visitsResult.error ?? paymentsResult.error ?? runsResult.error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const visits = visitsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const runs = runsResult.data ?? [];

  return NextResponse.json({
    periodStart: start.toISOString(),
    visits: {
      total: visits.length,
      pendingValidation: visits.filter(
        (visit) => visit.status === "pending_validation",
      ).length,
      approvedForPayment: visits.filter(
        (visit) => visit.status === "approved_for_payment",
      ).length,
    },
    finance: {
      patientChargeCents: visits.reduce(
        (sum, visit) => sum + visit.patient_charge_cents,
        0,
      ),
      collaboratorPayoutCents: visits.reduce(
        (sum, visit) => sum + visit.collaborator_payout_cents,
        0,
      ),
      receivedPaymentCents: payments.reduce(
        (sum, payment) => sum + payment.amount_cents,
        0,
      ),
    },
    automation: {
      totalRuns: runs.length,
      succeeded: runs.filter((run) => run.status === "succeeded").length,
      failed: runs.filter((run) => run.status === "failed").length,
    },
  });
}
