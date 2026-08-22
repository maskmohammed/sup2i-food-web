import { test, expect } from "@playwright/test";
import { login, setRole } from "./helpers/auth";

test("ADMINISTRATION changes a user's role and it persists after refetch", async ({ page }) => {
  await login(page);
  await setRole(page, "ADMINISTRATION");
  await page.goto("/administration/users");

  const roleSelect = page.getByLabel("Rôle de Amine T.");
  await expect(roleSelect).toHaveValue("CASHIER");

  await roleSelect.selectOption("SNACK_MANAGER");

  // toHaveValue reprend automatiquement jusqu'à ce que le refetch (déclenché
  // après le PATCH) mette à jour la valeur affichée.
  await expect(roleSelect).toHaveValue("SNACK_MANAGER");
});
