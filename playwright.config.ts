import { defineConfig, devices } from "@playwright/test";

/**
 * Parallélisme entre fichiers : volontairement laissé au comportement par
 * défaut de Playwright (fichiers en parallèle, plusieurs workers), sans
 * désactivation. Ce n'est pas un risque ici : en mode mock,
 * `apiFetch` n'appelle jamais le serveur Next.js par HTTP — il appelle
 * `resolveMock` directement dans le bundle client, exécuté dans le
 * contexte du navigateur. Playwright crée un contexte de navigateur isolé
 * par test (comme un nouvel onglet de navigation privée) : l'état des
 * mocks (tableaux en mémoire dans src/lib/api/mocks/index.ts) vit dans ce
 * contexte, jamais dans le processus Node du serveur — donc aucune
 * collision possible entre tests parallèles, même sur des fichiers
 * différents.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
