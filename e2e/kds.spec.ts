import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("SNACK_MANAGER queues an order then starts it from the KDS board", async ({ page }) => {
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

  // Une vente POS crée la commande en PAID (simplification MVP). Le KDS
  // n'affiche jamais une commande non payée ET n'expose de bouton d'action
  // que pour QUEUED/PREPARING (règle absolue + kds/page.tsx getCardAction)
  // : on la met d'abord en file depuis /orders, comme dans
  // orders-transition.spec.ts.
  await page.getByRole("link", { name: "Commandes" }).click();
  await page.getByRole("link", { name: new RegExp(orderCode!) }).click();
  await page.waitForURL(/\/orders\/.+/);
  await page.getByRole("button", { name: "En file" }).click();
  await expect(page.getByText("En file")).toBeVisible();

  // Navigation client-side (Link), pas page.goto : voir le piège documenté
  // dans CLAUDE_PROJECT.md (mocks en mémoire réinitialisés par un vrai
  // rechargement de page).
  await page.getByRole("link", { name: "KDS" }).click();

  // Le seed A-1045 est déjà QUEUED : plusieurs boutons "Commencer" existent
  // sur le board. On cible précisément la carte de notre commande via son
  // code, jamais un bouton générique.
  const ourCard = page
    .locator("div")
    .filter({ hasText: orderCode! })
    .filter({ hasText: "Commencer" })
    .last();
  await expect(ourCard).toBeVisible();
  await ourCard.getByRole("button", { name: "Commencer" }).click();

  // Le mock ajoute un délai réseau simulé de 300-600ms (client.ts,
  // randomDelay) sur CHAQUE appel, y compris le refetch déclenché après la
  // transition. On attend que le bouton "Prête" apparaisse (signe que la
  // mutation ET le refetch KDS ont bien abouti) avant de naviguer ailleurs
  // — sinon la page /orders suivante peut lire un état pas encore à jour.
  await expect(ourCard.getByRole("button", { name: "Prête" })).toBeVisible();

  // Le KDS n'affiche aucun libellé de statut littéral sur la carte (seule
  // l'action disponible change) : on vérifie le passage en PREPARING sur la
  // page de détail, même mécanisme déjà validé que orders-transition.spec.ts.
  await page.getByRole("link", { name: "Commandes" }).click();
  await page.getByRole("link", { name: new RegExp(orderCode!) }).click();
  await page.waitForURL(/\/orders\/.+/);
  await expect(page.getByText("En préparation")).toBeVisible();
});
