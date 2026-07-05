import { expect, test } from "@playwright/test";

const email = process.env.KROMED_E2E_EMAIL ?? "admin@example.com";
const password = process.env.KROMED_E2E_PASSWORD ?? "password123";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena").fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test("leader and collaborator prototype navigation is wired", async ({ page }) => {
  await login(page);

  await expect(page.getByText("Kromed").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Panel de Karla/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Portal de colaborador/ }),
  ).toBeVisible();

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
    await expect(page.getByRole("button", { name: item })).toBeVisible();
  }

  await page.getByRole("button", { name: "Códigos de turno" }).click();
  await expect(
    page.getByRole("heading", { name: "Códigos de turno" }),
  ).toBeVisible();

  await page.getByRole("button", { name: /Portal de colaborador/ }).click();
  await expect(page.getByRole("button", { name: "Mi agenda" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mis pacientes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Mis pagos" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mi agenda" })).toBeVisible();
});

test("prototype shell stays usable on mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);

  await expect(page.getByText("Kromed").first()).toBeVisible();
  await page.getByRole("button", { name: "Pacientes" }).click();
  await expect(page.getByRole("heading", { name: "Pacientes" })).toBeVisible();
  await expect(
    page
      .getByLabel("Navegación principal")
      .getByRole("button", { name: "Agendar visita" }),
  ).toBeVisible();
});
