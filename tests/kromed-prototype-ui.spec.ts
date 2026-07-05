import { expect, test } from "@playwright/test";

const leaderEmail = process.env.KROMED_E2E_LEADER_EMAIL ?? "lider@example.com";
const collaboratorEmail =
  process.env.KROMED_E2E_COLLABORATOR_EMAIL ?? "collaborator@example.com";
const password = process.env.KROMED_E2E_PASSWORD ?? "password123";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
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
    "Códigos de turno",
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
    .getByRole("button", { name: "Códigos de turno" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Códigos de turno" }),
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
