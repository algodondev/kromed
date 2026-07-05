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
    payoutPeriodsResult,
    automationRunsResult,
    paymentsResult,
    patientAssignmentsResult,
    clinicalNotesResult,
    visitSuppliesResult,
    equipmentRentalsResult,
    shiftCodesResult,
    hospitalShiftsResult,
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
      .from("payout_periods")
      .select("*, collaborators(name)")
      .order("period_start", { ascending: false }),
    supabase
      .from("automation_runs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("patient_payments")
      .select("*, patients(full_name)")
      .order("received_at", { ascending: false }),
    supabase
      .from("patient_assignments")
      .select("*, patients(full_name), collaborators(name, profession)")
      .eq("active", true)
      .order("assigned_at", { ascending: false }),
    supabase
      .from("visit_clinical_notes")
      .select("*, visits(patient_id), profiles(display_name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("visit_supplies")
      .select("*, inventory_items(name), visits(patient_id)")
      .order("created_at", { ascending: false }),
    supabase
      .from("equipment_rentals")
      .select("*, patients(full_name)")
      .order("period_start", { ascending: false }),
    supabase
      .from("shift_codes")
      .select("*")
      .order("code", { ascending: true }),
    supabase
      .from("hospital_shifts")
      .select("*, collaborators(name, profession), shift_codes(code, name)")
      .order("starts_at", { ascending: true }),
  ]);

  const patients = patientsResult.data ?? [];
  const collaborators = collaboratorsResult.data ?? [];
  const visits = visitsResult.data ?? [];
  const inventory = inventoryResult.data ?? [];
  const payoutLines = payoutLinesResult.data ?? [];
  const payoutPeriods = payoutPeriodsResult.data ?? [];
  const automationRuns = automationRunsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const patientAssignments = patientAssignmentsResult.data ?? [];
  const clinicalNotes = clinicalNotesResult.data ?? [];
  const visitSupplies = visitSuppliesResult.data ?? [];
  const equipmentRentals = equipmentRentalsResult.data ?? [];
  const shiftCodes = shiftCodesResult.data ?? [];
  const hospitalShifts = hospitalShiftsResult.data ?? [];

  return {
    profile,
    role: profile.role,
    patients,
    collaborators,
    visits,
    inventory,
    payoutLines,
    payoutPeriods,
    automationRuns,
    payments,
    patientAssignments,
    clinicalNotes,
    visitSupplies,
    equipmentRentals,
    shiftCodes,
    hospitalShifts,
    errorMessages: [
      patientsResult.error,
      collaboratorsResult.error,
      visitsResult.error,
      inventoryResult.error,
      payoutLinesResult.error,
      payoutPeriodsResult.error,
      automationRunsResult.error,
      paymentsResult.error,
      patientAssignmentsResult.error,
      clinicalNotesResult.error,
      visitSuppliesResult.error,
      equipmentRentalsResult.error,
      shiftCodesResult.error,
      hospitalShiftsResult.error,
    ].reduce<string[]>((messages, error) => {
      if (error) {
        messages.push(error.message);
      }

      return messages;
    }, []),
  };
}
