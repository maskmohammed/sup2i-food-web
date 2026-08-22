import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("SNACK_MANAGER creates a POS sale then moves it from PAID to PREPARING", async ({ page }) => {
  await login(page);
  await setRole(page, "SNACK_MANAGER");
  await page.goto("/pos");

  await page.getByLabel("Fond de caisse initial (DH)").fill("100");
  await page.getByRole("button", { name: "Ouvrir la session" }).click();
  await page.getByRole("button", { name: /^Coca/ }).first().click();
  await page.getByRole("button", { name: "Payer", exact: true }).click();
  await page.getByRole("button", { name: "Espèces" }).click();
  await page.getByRole("button", { name: "Confirmer le paiement" }).click();

  await expect(page.getByText("Ticket", { exact: true })).toBeVisible();
  const orderCode = await page.getByRole("heading", { level: 1 }).textContent();
  expect(orderCode).toBeTruthy();

  // Navigation via le lien du menu (client-side routing Next.js), pas
  // page.goto : un goto() ferait un vrai rechargement de page et
  // réinitialiserait les mocks en mémoire (mocks/index.ts), effaçant la
  // commande qu'on vient de créer.
  await page.getByRole("link", { name: "Commandes" }).click();
  await expect(page.getByRole("link", { name: new RegExp(orderCode!) })).toBeVisible();
  await page.getByRole("link", { name: new RegExp(orderCode!) }).click();

  // La commande vient d'être créée en PAID (simplification MVP) :
  // PAID -> QUEUED ("En file") puis QUEUED -> PREPARING ("En préparation").
  await page.getByRole("button", { name: "En file" }).click();
  await expect(page.getByText("En file")).toBeVisible();

  await page.getByRole("button", { name: "En préparation" }).click();
  await expect(page.getByText("En préparation")).toBeVisible();
});
