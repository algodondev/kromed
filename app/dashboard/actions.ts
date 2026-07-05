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

const initialError = (message: string): CreateCollaboratorState => ({
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

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return initialError("Inicia sesion para crear colaboradores.");
  }

  const { data: actorProfile, error: actorError } = await supabase
    .from("profiles")
    .select("id, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (actorError || !actorProfile?.active || actorProfile.role !== "admin") {
    return initialError("Solo el lider puede crear colaboradores.");
  }

  const { data: existingProfile } = await supabase
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

  const { error: profileError } = await supabase.from("profiles").insert({
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

  const { error: collaboratorError } = await supabase.from("collaborators").insert({
    profile_id: authResult.userId,
    name,
    contact_phone: phone || null,
    profession: profession || null,
    default_payout_cents: payoutCents,
    notes: notes || null,
    active: true,
  });

  if (collaboratorError) {
    await supabase.from("profiles").delete().eq("id", authResult.userId);

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
