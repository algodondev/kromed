import { NextResponse } from "next/server";
import { assertAutomationRequest } from "@/lib/automation";
import type { Json } from "@/lib/database.types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const params = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const { error } = await auth.supabase.from("automation_runs").insert({
    workflow_name: "upcoming_visit_reminder",
    trigger_source: "n8n",
    status: "succeeded",
    related_entity_table: "visits",
    related_entity_id:
      typeof body.visitId === "string" ? body.visitId : null,
    input_snapshot: {
      reminderId: params.id,
      ...body,
    } as Json,
    output_snapshot: {
      markedSent: true,
      sentAt:
        typeof body.sentAt === "string"
          ? body.sentAt
          : new Date().toISOString(),
    } as Json,
    completed_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
