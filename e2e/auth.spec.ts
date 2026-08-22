import { test, expect } from "@playwright/test";
import { login } from "./helpers/auth";

test("wrong password shows an error and stays on /login", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Identifiant").fill("e2e-test");
  await page.getByLabel("Mot de passe").fill("wrong");
  await page.getByRole("button", { name: "Se connecter" }).click();

  // error-state a role="alert" (voir a11y W14) — annoncé, et repérable sans sélecteur CSS.
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL("/login");
});

test("valid login redirects to /dashboard", async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});

test("direct access to /dashboard without auth redirects to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await page.waitForURL("/login");
  await expect(page.getByRole("heading", { name: "Connexion staff" })).toBeVisible();
});
