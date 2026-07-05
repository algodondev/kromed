import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";

export async function GET(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("visits")
    .select(
      "id, scheduled_start, completed_at, patient_charge_cents, collaborator_payout_cents, patients(full_name), collaborators(name)",
    )
    .eq("status", "pending_validation")
    .order("completed_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ visits: data ?? [] });
}
