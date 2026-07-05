import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

export function assertAutomationRequest(request: Request) {
  const configuredToken = process.env.KROMED_AUTOMATION_API_TOKEN;

  if (!configuredToken) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "KROMED_AUTOMATION_API_TOKEN is not configured" },
        { status: 503 },
      ),
    };
  }

  const header = request.headers.get("authorization");
  const expected = `Bearer ${configuredToken}`;

  if (header !== expected) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
        { status: 503 },
      ),
    };
  }

  return { ok: true as const, supabase };
}

export function mapAutomationStatus(status: unknown) {
  if (status === "completed") return "succeeded";
  if (status === "queued" || status === "running" || status === "failed") {
    return status;
  }
  return "succeeded";
}
