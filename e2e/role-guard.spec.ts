import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("CASHIER is denied direct access to /administration/catalogue", async ({ page }) => {
  await login(page);
  await setRole(page, "CASHIER");
  await page.goto("/administration/catalogue");

  // RequireRole affiche error-state avec le code PERMISSION_DENIED
  // (voir require-role.tsx) — role="alert" depuis le travail a11y W14.
  // Next.js ajoute lui-même un role="alert" vide (__next-route-announcer__,
  // pour l'annonce de navigation App Router) : on filtre sur le texte pour
  // ne cibler que l'alerte applicative.
  const permissionAlert = page.getByRole("alert").filter({ hasText: "Vous n'avez pas les droits" });
  await expect(permissionAlert).toContainText("Vous n'avez pas les droits nécessaires");
  await expect(page.getByRole("heading", { name: "Catalogue" })).toHaveCount(0);
});
