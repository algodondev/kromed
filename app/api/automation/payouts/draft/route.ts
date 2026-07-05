import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";

export async function GET(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("visits")
    .select(
      "id, scheduled_start, collaborator_payout_cents, patients(full_name), collaborators(id, name)",
    )
    .eq("status", "approved_for_payment")
    .order("scheduled_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const totalAmountCents = (data ?? []).reduce(
    (sum, visit) => sum + visit.collaborator_payout_cents,
    0,
  );

  return NextResponse.json({
    totalAmountCents,
    lines: data ?? [],
  });
}
