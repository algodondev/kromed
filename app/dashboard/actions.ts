"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Database } from "@/lib/database.types";

export type CreateCollaboratorState = {
  status: "idle" | "success" | "error";
  message: string;
};

type CreatedUserRole = "admin" | "collaborator";
type ShiftType = Database["public"]["Enums"]["shift_type"];
type AvailabilityBehavior =
  Database["public"]["Enums"]["shift_availability_behavior"];

export type CreateShiftCodeState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type CreateInventoryOrEquipmentState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type CreateVisitState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialError = (message: string): CreateCollaboratorState => ({
  status: "error",
  message,
});

const shiftCodeError = (message: string): CreateShiftCodeState => ({
  status: "error",
  message,
});

const inventoryEquipmentError = (
  message: string,
): CreateInventoryOrEquipmentState => ({
  status: "error",
  message,
});

const visitError = (message: string): CreateVisitState => ({
  status: "error",
  message,
});

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function parsePayoutCents(value: string) {
  if (!value) return 0;

  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseMoneyCents(value: string) {
  if (!value) return 0;

  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseStockQuantity(value: string) {
  if (!value) return null;

  const amount = Number(value);

  if (!Number.isInteger(amount) || amount < 0) {
    return undefined;
  }

  return amount;
}

function parsePositiveNumber(value: string) {
  const amount = Number(value.replace(",", "."));

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function parseScheduledStart(date: string, time: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  const startsAt = new Date(`${date}T${time}:00`);

  if (Number.isNaN(startsAt.getTime())) {
    return null;
  }

  return startsAt;
}

function normalizeTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function normalizeShiftType(value: string): ShiftType {
  if (["day", "night", "mixed", "custom"].includes(value)) {
    return value as ShiftType;
  }

  return "custom";
}

function normalizeAvailabilityBehavior(value: string): AvailabilityBehavior {
  if (["unavailable", "available", "neutral"].includes(value)) {
    return value as AvailabilityBehavior;
  }

  return "neutral";
}

async function requireAdminProfile() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Inicia sesion para continuar.",
      profile: null,
      supabase,
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile?.active || profile.role !== "admin") {
    return {
      error: "Solo el lider puede realizar esta accion.",
      profile: null,
      supabase,
    };
  }

  return {
    error: null,
    profile,
    supabase,
  };
}

async function createAuthUser({
  email,
  password,
  displayName,
  role,
}: {
  email: string;
  password: string;
  displayName: string;
  role: CreatedUserRole;
}) {
  const admin = createAdminClient();

  if (admin) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
        role,
      },
    });

    return {
      admin,
      error,
      userId: data.user?.id ?? null,
    };
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      admin: null,
      error: new Error("Supabase no esta configurado para crear usuarios."),
      userId: null,
    };
  }

  const authClient = createSupabaseClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const { data, error } = await authClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        role,
      },
    },
  });

  return {
    admin: null,
    error,
    userId: data.user?.id ?? null,
  };
}

export async function createVisitAction(
  _state: CreateVisitState,
  formData: FormData,
): Promise<CreateVisitState> {
  const patientId = field(formData, "patientId");
  const collaboratorId = field(formData, "collaboratorId");
  const date = field(formData, "date");
  const time = field(formData, "time");
  const patientChargeCents = parseMoneyCents(field(formData, "patientCharge"));
  const collaboratorPayoutCents = parseMoneyCents(field(formData, "collaboratorPayout"));
  const notes = field(formData, "notes");
  const scheduledStart = parseScheduledStart(date, time);

  if (!patientId || !collaboratorId || !scheduledStart) {
    return visitError("Paciente, colaborador, fecha y hora son obligatorios.");
  }

  if (patientChargeCents === null || collaboratorPayoutCents === null) {
    return visitError("Precio y pago deben ser montos validos en USD.");
  }

  const auth = await requireAdminProfile();

  if (auth.error || !auth.profile) {
    return visitError("Solo el lider puede agendar visitas.");
  }

  const [{ data: patient }, { data: collaborator }] = await Promise.all([
    auth.supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .maybeSingle(),
    auth.supabase
      .from("collaborators")
      .select("id")
      .eq("id", collaboratorId)
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!patient || !collaborator) {
    return visitError("Selecciona un paciente y colaborador validos.");
  }

  const scheduledEnd = new Date(scheduledStart);
  scheduledEnd.setHours(scheduledEnd.getHours() + 1);

  const { error } = await auth.supabase.from("visits").insert({
    patient_id: patientId,
    collaborator_id: collaboratorId,
    scheduled_start: scheduledStart.toISOString(),
    scheduled_end: scheduledEnd.toISOString(),
    patient_charge_cents: patientChargeCents,
    collaborator_payout_cents: collaboratorPayoutCents,
    payout_rate_source: "manual_override",
    status: "pending_validation",
    notes: notes || null,
    created_by: auth.profile.id,
  });

  if (error) {
    return visitError(error.message);
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: "Visita agendada y enviada a validacion.",
  };
}

export async function createCollaboratorAction(
  _state: CreateCollaboratorState,
  formData: FormData,
): Promise<CreateCollaboratorState> {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const userRole = field(formData, "userRole");
  const role: CreatedUserRole = userRole === "admin" ? "admin" : "collaborator";
  const phone = field(formData, "phone");
  const profession = field(formData, "profession");
  const notes = field(formData, "notes");
  const payoutCents = parsePayoutCents(field(formData, "defaultPayout"));

  if (!name || !email || !password) {
    return initialError("Nombre, correo y contrasena temporal son obligatorios.");
  }

  if (!email.includes("@")) {
    return initialError("Escribe un correo electronico valido.");
  }

  if (password.length < 6) {
    return initialError("La contrasena temporal debe tener al menos 6 caracteres.");
  }

  if (payoutCents === null) {
    return initialError("La tarifa base debe ser un monto valido en USD.");
  }

  const auth = await requireAdminProfile();

  if (auth.error || !auth.profile) {
    return initialError("Solo el lider puede crear colaboradores.");
  }

  const { data: existingProfile } = await auth.supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return initialError("Ya existe un perfil con ese correo.");
  }

  const authResult = await createAuthUser({
    email,
    password,
    displayName: name,
    role,
  });

  if (authResult.error || !authResult.userId) {
    return initialError(
      authResult.error?.message ?? "No se pudo crear el usuario en Supabase Auth.",
    );
  }

  const { error: profileError } = await auth.supabase.from("profiles").insert({
    id: authResult.userId,
    email,
    display_name: name,
    phone: phone || null,
    role,
    active: true,
  });

  if (profileError) {
    if (authResult.admin) {
      await authResult.admin.auth.admin.deleteUser(authResult.userId);
    }

    return initialError(profileError.message);
  }

  if (role === "admin") {
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Lider creado: ${name}`,
    };
  }

  const { error: collaboratorError } = await auth.supabase
    .from("collaborators")
    .insert({
      profile_id: authResult.userId,
      name,
      contact_phone: phone || null,
      profession: profession || null,
      default_payout_cents: payoutCents,
      notes: notes || null,
      active: true,
    });

  if (collaboratorError) {
    await auth.supabase.from("profiles").delete().eq("id", authResult.userId);

    if (authResult.admin) {
      await authResult.admin.auth.admin.deleteUser(authResult.userId);
    }

    return initialError(collaboratorError.message);
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Colaborador creado: ${name}`,
  };
}

export async function createShiftCodeAction(
  _state: CreateShiftCodeState,
  formData: FormData,
): Promise<CreateShiftCodeState> {
  const code = field(formData, "code").toUpperCase();
  const name = field(formData, "name");
  const startTime = normalizeTime(field(formData, "startTime"));
  const endTime = normalizeTime(field(formData, "endTime"));
  const hours = parsePositiveNumber(field(formData, "hours"));
  const shiftType = normalizeShiftType(field(formData, "shiftType"));
  const availabilityBehavior = normalizeAvailabilityBehavior(
    field(formData, "availabilityBehavior"),
  );
  const appliesGlobally = formData.get("appliesGlobally") === "on";
  const active = formData.getAll("active").includes("on");

  if (!code || !name || !startTime || !endTime || hours === null) {
    return shiftCodeError(
      "Codigo, nombre, horario y horas son obligatorios y deben ser validos.",
    );
  }

  const auth = await requireAdminProfile();

  if (auth.error || !auth.profile) {
    return shiftCodeError("Solo el lider puede crear codigos de turno.");
  }

  const { data: existingCode } = await auth.supabase
    .from("shift_codes")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (existingCode) {
    return shiftCodeError("Ya existe un codigo de turno con ese codigo.");
  }

  const { error } = await auth.supabase.from("shift_codes").insert({
    code,
    name,
    start_time: startTime,
    end_time: endTime,
    hours,
    shift_type: shiftType,
    availability_behavior: availabilityBehavior,
    applies_globally: appliesGlobally,
    active,
    created_by: auth.profile.id,
  });

  if (error) {
    return shiftCodeError(error.message);
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Codigo creado: ${code}`,
  };
}

export async function createInventoryOrEquipmentAction(
  _state: CreateInventoryOrEquipmentState,
  formData: FormData,
): Promise<CreateInventoryOrEquipmentState> {
  const itemType = field(formData, "itemType");
  const name = field(formData, "name");

  if (!name) {
    return inventoryEquipmentError("Escribe el nombre del insumo o equipo.");
  }

  const auth = await requireAdminProfile();

  if (auth.error || !auth.profile) {
    return inventoryEquipmentError("Solo el lider puede crear insumos o equipos.");
  }

  if (itemType === "equipment") {
    const patientId = field(formData, "patientId");
    const monthlyChargeCents = parseMoneyCents(field(formData, "monthlyCharge"));
    const periodStart = field(formData, "periodStart");
    const periodEnd = field(formData, "periodEnd");
    const status = field(formData, "equipmentStatus") || "active";

    if (!patientId || monthlyChargeCents === null || !periodStart) {
      return inventoryEquipmentError(
        "Equipo, paciente, cobro mensual y fecha de inicio son obligatorios.",
      );
    }

    if (!["active", "ended", "canceled"].includes(status)) {
      return inventoryEquipmentError("El estado del equipo no es valido.");
    }

    const { error } = await auth.supabase.from("equipment_rentals").insert({
      equipment_name: name,
      patient_id: patientId,
      monthly_charge_cents: monthlyChargeCents,
      period_start: periodStart,
      period_end: periodEnd || null,
      status,
      created_by: auth.profile.id,
    });

    if (error) {
      return inventoryEquipmentError(error.message);
    }

    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Equipo creado: ${name}`,
    };
  }

  const patientChargeCents = parseMoneyCents(field(formData, "patientCharge"));
  const trackStock = formData.get("trackStock") === "on";
  const stockQuantity = parseStockQuantity(field(formData, "stockQuantity"));
  const status = field(formData, "supplyStatus") === "inactive" ? "inactive" : "active";

  if (patientChargeCents === null || stockQuantity === undefined) {
    return inventoryEquipmentError(
      "Precio e inventario deben ser numeros validos.",
    );
  }

  const { error } = await auth.supabase.from("inventory_items").insert({
    name,
    patient_charge_price_cents: patientChargeCents,
    track_stock: trackStock,
    stock_quantity: trackStock ? stockQuantity : null,
    status,
  });

  if (error) {
    return inventoryEquipmentError(error.message);
  }

  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `Insumo creado: ${name}`,
  };
}
