import type { Page } from "@playwright/test";

/**
 * Connexion mock : le login accepte n'importe quel identifiant, et ne
 * refuse que motDePasse === "wrong" (voir handleLogin dans
 * src/lib/api/mocks/index.ts). Le rôle retourné par le mock est toujours
 * ADMINISTRATION par défaut — utiliser setRole() ensuite si le test a
 * besoin d'un autre rôle.
 */
export async function login(page: Page, identifiant = "e2e-test"): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Identifiant").fill(identifiant);
  // exact: true — le bouton afficher/masquer porte un aria-label
  // "Afficher le mot de passe" qui contiendrait sinon "Mot de passe" en
  // sous-chaîne (match par défaut de getByLabel).
  await page.getByLabel("Mot de passe", { exact: true }).fill("e2e-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("/dashboard");
}

/**
 * Change le rôle actif via le sélecteur "MODE DEV" (role-switcher.tsx),
 * disponible dans l'en-tête de toute page staff une fois connecté. Les
 * valeurs d'option sont les enums Role bruts (ex "CASHIER"), pas les
 * libellés français affichés.
 */
export async function setRole(page: Page, role: string): Promise<void> {
  await page.getByLabel("Rôle simulé").selectOption(role);
}
