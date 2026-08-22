import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("CANTEEN_MANAGER distributes a meal, then sees it marked as already used", async ({ page }) => {
  await login(page);
  await setRole(page, "CANTEEN_MANAGER");
  await page.goto("/cantine");

  // FP-1001 = Yassine El Amrani, abonnement actif (seed mocks/index.ts).
  await page.getByLabel("Code Food Pass").fill("FP-1001");
  await page.getByRole("button", { name: "Rechercher" }).click();
  await expect(page.getByText("Yassine El Amrani")).toBeVisible();

  await page.getByRole("button", { name: "Distribuer — Déjeuner" }).click();
  await expect(page.getByText("Déjeuner distribué avec succès.")).toBeVisible();

  await page.getByRole("button", { name: "Scan suivant" }).click();
  await page.getByLabel("Code Food Pass").fill("FP-1001");
  await page.getByRole("button", { name: "Rechercher" }).click();

  await expect(page.getByRole("button", { name: /Déjà distribué aujourd'hui/ })).toBeVisible();
});
