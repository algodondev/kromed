import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";

const leaderEmail = process.env.KROMED_E2E_LEADER_EMAIL ?? "lider@example.com";
const collaboratorEmail =
  process.env.KROMED_E2E_COLLABORATOR_EMAIL ?? "collaborator@example.com";
const password = process.env.KROMED_E2E_PASSWORD ?? "password123";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

function localEnvValue(name: string) {
  if (process.env[name]) return process.env[name];

  if (!fs.existsSync(".env.local")) return undefined;

  const match = fs
    .readFileSync(".env.local", "utf8")
    .match(new RegExp(`^${name}=(.*)$`, "m"));

  return match?.[1]?.trim();
}

async function deleteShiftCode(code: string) {
  const supabaseUrl = localEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = localEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await supabase.from("shift_codes").delete().eq("code", code);
}

async function deleteInventoryItem(name: string) {
  const supabaseUrl = localEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = localEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await supabase.from("inventory_items").delete().eq("name", name);
}

async function deleteEquipmentRental(name: string) {
  const supabaseUrl = localEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = localEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await supabase.from("equipment_rentals").delete().eq("equipment_name", name);
}

async function deleteVisitByNotes(notes: string) {
  const supabaseUrl = localEnvValue("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = localEnvValue("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await supabase.from("visits").delete().eq("notes", notes);
}

test("leader dashboard is production shell with leader navigation only", async ({
  page,
}) => {
  await login(page, leaderEmail);

  await expect(page.getByRole("heading", { name: "Panel del día" })).toBeVisible();
  await expect(page.getByText("Vista web - prototipo navegable")).toHaveCount(0);
  await expect(page.getByText("Prototipo navegable")).toHaveCount(0);
  await expect(page.getByText(/app\.kromed\.com/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Panel de Karla/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Portal de colaborador/ })).toHaveCount(0);

  for (const item of [
    "Inicio",
    "Calendario",
    "Pacientes",
    "Agendar visita",
    "Colaboradores",
    "Validación de visitas",
    "Insumos e inventario",
    "Códigos de visita",
    "Pagos y cobros",
    "Reportes",
  ]) {
    await expect(
      page.getByLabel("Navegación principal").getByRole("button", { name: item }),
    ).toBeVisible();
  }

  await expect(page.getByRole("button", { name: "Mi agenda" })).toHaveCount(0);

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Códigos de visita" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Códigos de visita" }),
  ).toBeVisible();
});

test("collaborator dashboard is production shell with collaborator navigation only", async ({
  page,
}) => {
  await login(page, collaboratorEmail);

  await expect(page.getByRole("heading", { name: "Mi agenda" })).toBeVisible();
  await expect(page.getByText("Vista web - prototipo navegable")).toHaveCount(0);
  await expect(page.getByText("Prototipo navegable")).toHaveCount(0);
  await expect(page.getByText(/app\.kromed\.com/)).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Panel de Karla/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Portal de colaborador/ })).toHaveCount(0);

  for (const item of ["Mi agenda", "Mis pacientes", "Mis pagos"]) {
    await expect(
      page.getByLabel("Navegación principal").getByRole("button", { name: item }),
    ).toBeVisible();
  }

  await expect(
    page.getByLabel("Navegación principal").getByRole("button", {
      name: /^Pacientes$/,
    }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Navegación principal").getByRole("button", {
      name: /^Colaboradores$/,
    }),
  ).toHaveCount(0);

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Mis pacientes" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pacientes asignados" }),
  ).toBeVisible();
});

test("production shell stays within mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, leaderEmail);

  await page.getByLabel("Navegación principal").getByRole("button", { name: "Pacientes" }).click();
  await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();

  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
});

test("leader can schedule a visit and see it in validation", async ({ page }) => {
  let visitNotes = "";

  try {
    await login(page, leaderEmail);

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Agendar visita" })
      .click();

    await expect(page.getByRole("heading", { name: "Agendar visita" })).toBeVisible();
    await expect(page.getByText("Nueva visita")).toBeVisible();

    const wrapperBox = await page.getByTestId("schedule-visit-panel").boundingBox();
    const formBox = await page.getByTestId("schedule-visit-card").boundingBox();
    expect(wrapperBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    const wrapperCenter = wrapperBox!.x + wrapperBox!.width / 2;
    const formCenter = formBox!.x + formBox!.width / 2;
    expect(Math.abs(wrapperCenter - formCenter)).toBeLessThanOrEqual(2);

    visitNotes = `Visita E2E validacion ${Date.now()}`;

    await page.getByLabel("Paciente", { exact: true }).selectOption({ index: 0 });
    await page.getByLabel("Colaborador del equipo").selectOption({ index: 0 });
    await page.getByLabel("Fecha").fill("2026-07-08");
    await page.getByLabel("Hora").fill("09:30");
    await page.getByLabel("Precio al paciente").fill("45");
    await page.getByLabel("Pago al colaborador").fill("25");
    await page.getByLabel("Notas internas").fill(visitNotes);

    await page
      .getByTestId("schedule-visit-card")
      .getByRole("button", { name: "Agendar visita" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Validación de visitas" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(visitNotes)).toBeVisible({ timeout: 20_000 });
  } finally {
    if (visitNotes) {
      await deleteVisitByNotes(visitNotes);
    }
  }
});

test("calendar filters collaborators and shows saved scheduled visits", async ({
  page,
}) => {
  let visitNotes = "";

  try {
    await login(page, leaderEmail);

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Agendar visita" })
      .click();

    const collaborator = await page
      .getByLabel("Colaborador del equipo")
      .evaluate((select) => {
        const options = Array.from((select as HTMLSelectElement).options);
        const option = options.at(-1);

        return {
          count: options.length,
          id: option?.value ?? "",
          name: option?.textContent?.trim() ?? "",
        };
      });

    expect(collaborator.count).toBeGreaterThan(0);
    expect(collaborator.id).not.toBe("");

    visitNotes = `Calendario E2E ${Date.now()}`;

    await page.getByLabel("Paciente", { exact: true }).selectOption({ index: 0 });
    await page.getByLabel("Colaborador del equipo").selectOption(collaborator.id);
    await page.getByLabel("Fecha").fill("2026-07-09");
    await page.getByLabel("Hora").fill("10:45");
    await page.getByLabel("Precio al paciente").fill("50");
    await page.getByLabel("Pago al colaborador").fill("30");
    await page.getByLabel("Notas internas").fill(visitNotes);

    await page
      .getByTestId("schedule-visit-card")
      .getByRole("button", { name: "Agendar visita" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Validación de visitas" }),
    ).toBeVisible({ timeout: 20_000 });

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Calendario" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Calendario inteligente" }),
    ).toBeVisible();
    await expect(page.getByTestId("calendar-collaborator-filter")).toBeVisible();

    await page.getByTestId("calendar-collaborator-filter").selectOption(collaborator.id);

    await expect(page.getByTestId(`calendar-column-${collaborator.id}`)).toBeVisible();
    await expect(page.getByText(visitNotes)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Semana" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Día" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mes" })).toHaveCount(0);

    await page.getByTestId("calendar-collaborator-filter").selectOption("all");
    await expect(page.locator('[data-testid^="calendar-column-"]')).toHaveCount(
      Math.min(collaborator.count, 4),
    );
  } finally {
    if (visitNotes) {
      await deleteVisitByNotes(visitNotes);
    }
  }
});

test("leader can create a collaborator from collaborators tab", async ({
  page,
}) => {
  await login(page, leaderEmail);

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Colaboradores" })
    .click();

  await expect(page.getByRole("heading", { name: "Colaboradores" })).toBeVisible();

  await page.getByRole("button", { name: "Agregar colaborador" }).click();
  await expect(page.getByText("Nuevo usuario")).toBeVisible();

  const suffix = Date.now();
  const collaboratorName = `Colaborador E2E ${suffix}`;

  await page.getByLabel("Nombre completo").fill(collaboratorName);
  await page
    .getByLabel("Correo electronico")
    .fill(`colaborador.e2e.${suffix}@gmail.com`);
  await page.getByLabel("Contrasena temporal").fill("password123");
  await page.getByLabel("Telefono").fill("+503 7000 0000");
  await page.getByLabel("Especialidad").fill("Terapia respiratoria");
  await page.getByLabel("Tarifa base por visita (USD)").fill("25");
  await page.getByLabel("Notas internas").fill("Creado desde prueba E2E.");

  await page.getByRole("button", { name: "Crear colaborador" }).click();

  await expect(page.getByText("Nuevo usuario")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByRole("cell", { name: collaboratorName })).toBeVisible({
    timeout: 20_000,
  });
});

test("leader can create another leader with admin access", async ({ page }) => {
  await login(page, leaderEmail);

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Colaboradores" })
    .click();

  await page.getByRole("button", { name: "Agregar colaborador" }).click();
  await expect(page.getByText("Nuevo usuario")).toBeVisible();

  const suffix = Date.now();
  const newLeaderEmail = `lider.e2e.${suffix}@gmail.com`;
  const newLeaderName = `Lider E2E ${suffix}`;

  await page.getByLabel("Tipo de usuario").selectOption("admin");
  await expect(page.getByLabel("Especialidad")).toHaveCount(0);
  await page.getByLabel("Nombre completo").fill(newLeaderName);
  await page.getByLabel("Correo electronico").fill(newLeaderEmail);
  await page.getByLabel("Contrasena temporal").fill(password);
  await page.getByLabel("Telefono").fill("+503 7000 0001");

  await page.getByRole("button", { name: "Crear lider" }).click();
  await expect(page.getByText("Nuevo usuario")).toHaveCount(0, { timeout: 20_000 });

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/$/, { timeout: 20_000 });

  await login(page, newLeaderEmail);
  await expect(page.getByRole("heading", { name: "Panel del día" })).toBeVisible();
  await expect(
    page.getByLabel("Navegación principal").getByRole("button", {
      name: "Colaboradores",
    }),
  ).toBeVisible();
});

test("leader can create a shift code from shift codes tab", async ({ page }) => {
  let shiftCode = "";

  try {
    await login(page, leaderEmail);

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Códigos de visita" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Códigos de visita" }),
    ).toBeVisible();

    const addCodeButton = page.getByTestId("open-visit-code-form");
    await expect(addCodeButton).toBeVisible();
    const addCodeBox = await addCodeButton.boundingBox();
    expect(addCodeBox).not.toBeNull();

    await page.mouse.click(
      addCodeBox!.x + addCodeBox!.width / 2,
      addCodeBox!.y + addCodeBox!.height / 2,
    );

    const dialog = page.getByRole("dialog", { name: "Nuevo código de visita" });
    await expect(dialog).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    shiftCode = `E2E${suffix}`;
    const shiftName = `Turno E2E ${suffix}`;

    await dialog.getByLabel("Código").fill(shiftCode);
    await dialog.getByLabel("Nombre / significado").fill(shiftName);
    await dialog.getByLabel("Hora inicio").fill("07:00");
    await dialog.getByLabel("Hora fin").fill("13:00");
    await dialog.getByLabel("Horas").fill("6");
    await dialog.getByLabel("Tipo").selectOption("day");
    await dialog.getByLabel("Disponibilidad").selectOption("unavailable");
    await dialog.getByLabel("Aplica globalmente").check();

    await dialog.getByRole("button", { name: "Guardar código" }).click();

    await expect(
      page.getByRole("dialog", { name: "Nuevo código de visita" }),
    ).toHaveCount(0, {
      timeout: 20_000,
    });
    await expect(page.getByRole("cell", { name: shiftCode })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole("cell", { name: shiftName })).toBeVisible();
  } finally {
    if (shiftCode) {
      await deleteShiftCode(shiftCode);
    }
  }
});

test("opening visit codes tab does not create a code", async ({ page }) => {
  await login(page, leaderEmail);

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Códigos de visita" })
    .click();

  await expect(
    page.getByRole("heading", { name: "Códigos de visita" }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Nuevo código de visita" }),
  ).toHaveCount(0);

  const rowsBefore = await page.locator("tbody tr").count();

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Inicio" })
    .click();
  await expect(page.getByRole("heading", { name: "Panel del día" })).toBeVisible();

  await page
    .getByLabel("Navegación principal")
    .getByRole("button", { name: "Códigos de visita" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Códigos de visita" }),
  ).toBeVisible();

  await expect(page.locator("tbody tr")).toHaveCount(rowsBefore);
});

test("leader can create an inventory supply from supplies tab", async ({ page }) => {
  let supplyName = "";

  try {
    await login(page, leaderEmail);

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Insumos e inventario" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Insumos e inventario" }),
    ).toBeVisible();

    const addButton = page.getByTestId("open-inventory-form");
    await expect(addButton).toBeVisible();
    const box = await addButton.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    const dialog = page.getByRole("dialog", { name: "Nuevo insumo o equipo" });
    await expect(dialog).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    supplyName = `Insumo E2E ${suffix}`;

    await dialog.getByLabel("Tipo").selectOption("supply");
    await dialog.getByLabel("Insumo").fill(supplyName);
    await dialog.getByLabel("Precio al paciente (USD)").fill("7.50");
    await dialog.getByRole("spinbutton", { name: "Inventario" }).fill("12");
    await dialog.getByLabel("Estado").selectOption("active");

    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(
      page.getByRole("dialog", { name: "Nuevo insumo o equipo" }),
    ).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("cell", { name: supplyName })).toBeVisible({
      timeout: 20_000,
    });
  } finally {
    if (supplyName) {
      await deleteInventoryItem(supplyName);
    }
  }
});

test("leader can create rental equipment from supplies tab", async ({ page }) => {
  let equipmentName = "";

  try {
    await login(page, leaderEmail);

    await page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Insumos e inventario" })
      .click();

    await expect(
      page.getByRole("heading", { name: "Insumos e inventario" }),
    ).toBeVisible();

    const addButton = page.getByTestId("open-inventory-form");
    await expect(addButton).toBeVisible();
    const box = await addButton.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);

    const dialog = page.getByRole("dialog", { name: "Nuevo insumo o equipo" });
    await expect(dialog).toBeVisible();

    const suffix = Date.now().toString().slice(-6);
    equipmentName = `Equipo E2E ${suffix}`;

    await dialog.getByLabel("Tipo").selectOption("equipment");
    await dialog.getByLabel("Equipo").fill(equipmentName);
    await dialog.getByLabel("Paciente").selectOption({ index: 1 });
    await dialog.getByLabel("Cobro mensual (USD)").fill("35");
    await dialog.getByLabel("Inicio del alquiler").fill("2026-07-05");
    await dialog.getByLabel("Estado").selectOption("active");

    await dialog.getByRole("button", { name: "Guardar" }).click();

    await expect(
      page.getByRole("dialog", { name: "Nuevo insumo o equipo" }),
    ).toHaveCount(0, { timeout: 20_000 });
    await expect(page.getByRole("cell", { name: equipmentName })).toBeVisible({
      timeout: 20_000,
    });
  } finally {
    if (equipmentName) {
      await deleteEquipmentRental(equipmentName);
    }
  }
});
