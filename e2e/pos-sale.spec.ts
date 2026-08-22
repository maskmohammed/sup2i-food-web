import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("CASHIER opens a session, adds a product, pays in cash and sees the ticket", async ({ page }) => {
  await login(page);
  await setRole(page, "CASHIER");
  await page.goto("/pos");

  await page.getByLabel("Fond de caisse initial (DH)").fill("100");
  await page.getByRole("button", { name: "Ouvrir la session" }).click();

  // Coca a une promotion "-10% sur les boissons" active par seed
  // (mocks/index.ts) : 700 centimes -> 630 = 6.30 DH. Le total du ticket
  // doit refléter ce calcul serveur, jamais un prix catalogue brut.
  await page.getByRole("button", { name: /^Coca/ }).first().click();

  await page.getByRole("button", { name: "Payer", exact: true }).click();
  await page.getByRole("button", { name: "Espèces" }).click();
  await page.getByRole("button", { name: "Confirmer le paiement" }).click();

  await expect(page.getByText("Ticket", { exact: true })).toBeVisible();

  // "6.30 DH" apparaît aussi comme prix unitaire de la ligne d'article (un
  // seul Coca) : on cible la ligne "Total" du ticket, pas le texte brut.
  const totalRow = page.getByText("Total", { exact: true }).locator("xpath=..");
  await expect(totalRow).toContainText("6.30 DH");
  await expect(page.getByText("Payé par Espèces")).toBeVisible();
});
