import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("ADMINISTRATION creates a promotion that appears active in the list", async ({ page }) => {
  await login(page);
  await setRole(page, "ADMINISTRATION");
  await page.goto("/administration/promotions");

  const label = `Promo E2E ${Date.now()}`;

  await page.getByLabel("Libellé").fill(label);
  await page.getByLabel("Réduction (%)").fill("15");
  await page.getByLabel("Coca").check();
  await page.getByRole("button", { name: "Créer la promotion" }).click();

  // Le mock crée toujours une promotion avec active: true (handleCreatePromotion).
  const row = page.locator("li").filter({ hasText: label });
  await expect(row).toBeVisible();
  await expect(row.getByRole("button", { name: "Active" })).toBeVisible();
});
