import { NextResponse } from "next/server";
import { assertAutomationRequest, mapAutomationStatus } from "@/lib/automation";
import type { Json } from "@/lib/database.types";

export async function POST(request: Request) {
  const auth = assertAutomationRequest(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const workflow =
    typeof body.workflow === "string" ? body.workflow : "n8n_workflow";
  const entityType =
    typeof body.entityType === "string" ? body.entityType : null;
  const entityId = typeof body.entityId === "string" ? body.entityId : null;
  const status = mapAutomationStatus(body.status);

  const { data, error } = await auth.supabase
    .from("automation_runs")
    .insert({
      workflow_name: workflow,
      trigger_source: "n8n",
      status,
      related_entity_table: entityType,
      related_entity_id: entityId,
      input_snapshot: body as Json,
      output_snapshot:
        typeof body.metadata === "object" && body.metadata !== null
          ? (body.metadata as Json)
          : null,
      completed_at:
        status === "succeeded" || status === "failed"
          ? new Date().toISOString()
          : null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ run: data }, { status: 201 });
}
