import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("DIRECTION sees the base KPI cards without error", async ({ page }) => {
  await login(page);
  await setRole(page, "DIRECTION");
  await page.goto("/direction");

  await expect(page.getByText("Chiffre d'affaires")).toBeVisible();
  await expect(page.getByText("Panier moyen")).toBeVisible();

  // Next.js pose lui-même un role="alert" vide (route announcer) sur
  // chaque page : on exclut ce cas pour ne détecter qu'une vraie erreur.
  await expect(page.getByRole("alert").filter({ hasText: /\S/ })).toHaveCount(0);
});
