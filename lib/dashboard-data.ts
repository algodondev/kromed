import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

export async function getDashboardData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/login?error=missing-profile");
  }

  const [
    patientsResult,
    collaboratorsResult,
    visitsResult,
    inventoryResult,
    payoutLinesResult,
    automationRunsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("patients")
      .select("*")
      .order("updated_at", { ascending: false }),
    supabase
      .from("collaborators")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("visits")
      .select(
        "*, patients(full_name, contact_name, contact_phone), collaborators(name, profession)",
      )
      .order("scheduled_start", { ascending: true }),
    supabase
      .from("inventory_items")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("payout_lines")
      .select("*, patients(full_name), collaborators(name), visits(scheduled_start)")
      .order("created_at", { ascending: false }),
    supabase
      .from("automation_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("patient_payments")
      .select("*, patients(full_name)")
      .order("received_at", { ascending: false }),
  ]);

  const patients = patientsResult.data ?? [];
  const collaborators = collaboratorsResult.data ?? [];
  const visits = visitsResult.data ?? [];
  const inventory = inventoryResult.data ?? [];
  const payoutLines = payoutLinesResult.data ?? [];
  const automationRuns = automationRunsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  return {
    profile,
    role: profile.role,
    patients,
    collaborators,
    visits,
    inventory,
    payoutLines,
    automationRuns,
    payments,
    errors: [
      patientsResult.error,
      collaboratorsResult.error,
      visitsResult.error,
      inventoryResult.error,
      payoutLinesResult.error,
      automationRunsResult.error,
      paymentsResult.error,
    ].filter(Boolean),
  };
}
