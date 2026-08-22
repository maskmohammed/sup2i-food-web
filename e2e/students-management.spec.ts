import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("ADMINISTRATION creates a new student who appears in the list", async ({ page }) => {
  await login(page);
  await setRole(page, "ADMINISTRATION");
  await page.goto("/administration/students");

  const fullName = `Etudiant E2E ${Date.now()}`;
  const foodPassCode = `FP-E2E-${Date.now()}`;

  await page.getByLabel("Nom complet").fill(fullName);
  await page.getByLabel("Code Food Pass").fill(foodPassCode);
  await page.getByRole("button", { name: "Créer l'étudiant" }).click();

  const row = page.locator("li").filter({ hasText: fullName });
  await expect(row).toBeVisible();
  await expect(row).toContainText(foodPassCode);
});
