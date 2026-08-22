import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("STOCK_MANAGER adjusts an item and sees the refetched quantity", async ({ page }) => {
  await login(page);
  await setRole(page, "STOCK_MANAGER");
  await page.goto("/stock");

  // Coca n'est pas en stock bas (40/seuil 10) : pas de risque d'ambiguïté
  // avec la section "Alertes stock bas".
  const cocaRow = page.locator("li").filter({ hasText: "Coca" });
  await expect(cocaRow).toBeVisible();

  const beforeText = await cocaRow.textContent();
  const beforeQty = Number(beforeText?.match(/(\d+)\s*unité/)?.[1]);
  expect(Number.isFinite(beforeQty)).toBe(true);

  await cocaRow.getByRole("button", { name: "Ajuster" }).click();
  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.getByLabel(/Quantité/).fill("5");
  await page.getByLabel("Motif").fill("Réception non enregistrée — test E2E");
  await page.getByRole("button", { name: "Confirmer" }).click();

  await expect(cocaRow).toContainText(`${beforeQty + 5} unité`);
});
