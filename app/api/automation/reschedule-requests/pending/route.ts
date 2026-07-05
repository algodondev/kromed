import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";

export async function GET(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const { data, error } = await auth.supabase
    .from("reschedule_requests")
    .select("*, visits(scheduled_start, scheduled_end, patients(full_name))")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
