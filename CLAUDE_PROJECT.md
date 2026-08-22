# CLAUDE.md — sup2i-food-web

> Ce fichier est lu par Claude Code à chaque session dans ce repo. Il fixe le contexte, les règles non négociables et la roadmap. Ne jamais s'en écarter sans décision explicite du responsable Web (Hamza).

---

## 0. Rôle

Tu es l'assistant de développement du repo **sup2i-food-web** (Next.js/React), au sein d'une équipe de 3 devs :

- Dev Mobile → `sup2i-food-mobile` (Flutter)
- Dev Backend → `sup2i-food-backend` (Spring Boot / PostgreSQL)
- **Hamza (moi)** → `sup2i-food-web`, responsable complet de ce repo

Le backend Spring Boot + PostgreSQL est l'unique source de vérité métier. Le Web est un **client**, jamais un second backend.

---

## 1. Règles absolues — ne jamais enfreindre

- Ne jamais coder directement sur `main`.
- Ne jamais connecter le navigateur/Next.js directement à PostgreSQL.
- Ne jamais accepter comme vérité un total/prix/stock calculé côté client.
- Ne jamais implémenter une transition d'état absente de la state machine des commandes.
- Décider le comportement UI avec `error.code`, jamais avec le texte `message`.
- Bloquer le double clic/double soumission sur toute action critique.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur.
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement. **Cactus = framework PHP maison de l'école, système de caisse existant à auditer en W13.**
- Ne jamais affirmer qu'une étape est "DONE" sans lint/build ET test réel.
- Prix stockés en centimes, jamais en float.
- Le total d'un panier/commande vient toujours d'un round-trip serveur.
- Une impression échouée n'est jamais traitée comme un paiement échoué.
- Ne jamais inventer un mapping/champ/donnée — dire "non calculable"/"non disponible" plutôt que fabriquer.
- Ne jamais utiliser "profit"/"bénéfice net" — valorisation stock/gaspillage toujours labellisée "estimation".
- Toute rangée avec texte tronqué : vérifier que les colonnes fixes combinées ne dépassent jamais la largeur disponible.
- Toute règle métier bloquante vérifiée UI ET serveur.
- Toute page sensible enveloppée par `RequireRole`.
- Les mocks sont en mémoire uniquement — F5/nouvel onglet réinitialise l'état, c'est attendu.
- Toute mutation critique doit être idempotente côté client via une clé générée avant l'appel (pattern posé sur le paiement POS en W14).
- Tout bouton icône-seule doit avoir un `aria-label` explicite ; tout champ un `<label>`/`aria-label` ; toute erreur affichée doit utiliser `role="alert"`/`aria-live` ; le focus clavier doit toujours être visible (`:focus-visible`, jamais `:focus` seul qui s'active aussi à la souris).

---

## 2. Workflow Git obligatoire

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/web-<nom-etape>
```

- Merge vers `develop` en local via `git merge` (jamais `main`).
- Avant tout push : `npm run lint`, `npm run build`.
- Avant tout `git checkout`, arrêter `npm run dev`.

---

## 3. Méthode de travail — une étape à la fois

1. Expliquer le but, proposer les commandes exactes.
2. Vérification EN CONDITIONS RÉELLES, deux thèmes, F5.
3. Lint/build OK.
4. Commit → push → merge vers `develop`.
5. Mise à jour `CURRENT_STATUS`.
6. Étape suivante seulement après validation explicite.

**Méthode de debug** (rodée en W12) : bug visuel persistant malgré code vérifié correct → (1) purger `.next` + redémarrer, (2) `console.log` temporaire pour confirmer la donnée au runtime, (3) inspecter le DOM réel via DevTools (Computed/Styles) plutôt que deviner.

**Méthode d'audit** (rodée en W14 a11y) : avant de corriger un problème transversal (accessibilité, sécurité), demander d'abord un audit complet listant les vrais gaps par catégorie (avec preuves — grep, calculs, mesures), distinguer les faux positifs, faire valider le périmètre avant de corriger.

**Méthode E2E** (rodée en W14) : les mocks vivent en mémoire dans le processus du serveur de dev. `page.goto()` dans un test Playwright déclenche une vraie navigation navigateur qui recharge la page — si un test crée une donnée sur une page puis va vérifier sur une autre via `page.goto()`, l'état mock est perdu. Utiliser la navigation client-side (cliquer un `<Link>` du site, pas `page.goto()`) pour préserver l'état entre deux étapes d'un même test.

**Piège E2E n°2** (rodé en W14, extension) : après avoir cliqué un `<Link>` client-side, ne jamais enchaîner directement sur une assertion `getByText`/`getByRole` susceptible de matcher aussi l'ancienne page — `expect(locator).toBeVisible()` réessaie tant que le locator ne matche RIEN, mais échoue immédiatement (sans retry) sur une "strict mode violation" (plusieurs matches), ce qui peut arriver si l'ancienne page contient un texte ambigu. Ajouter `await page.waitForURL(...)` après le clic, ou enchaîner sur une action (`.click()`) qui n'existe que sur la page cible (auto-wait naturel).

---

## 4. Roadmap W0 → W14

- **W0 à W12** ✅ TOUS TERMINÉS.
- **Portions de W14 anticipées** ✅ :
  - Résilience réseau : simulation de panne (toggle dev), timeout réel 8s, clé d'idempotence sur le paiement POS.
  - Accessibilité : `aria-label` sur champs Cantine/Users, `role="alert"`/`aria-live` sur error-state/loading-state, `focus-visible` global cohérent, `<h2>` pour les sous-sections manquantes (stock/catalogue/promotions/students). Contrastes de 3 couleurs de statut (`alert`, `ready`, `accent-warm`) **corrigés** : nouveaux tokens `-text` par thème (voir §6), appliqués uniquement aux usages texte (badges, libellés, montants), jamais aux pastilles/bordures décoratives (seuil 3:1 déjà respecté par les couleurs d'origine, inchangées).
  - Tests E2E : Playwright, 13 tests sur 11 flux critiques (auth, pos-sale, orders-transition, stock-adjustment, cantine-distribution, role-guard, kds, promotions, direction-kpi, users-role-change, students-management). Commande : `npm run test:e2e`.
- **W13 — Cactus / Matériel — audit d'intégration** — **BLOQUÉE, en attente d'accès externe** au code Cactus (PHP, école) et au matériel physique (scanner, imprimante, TPE). **Hamza fournira le code Cactus quand il l'aura — pas de blocage du reste du travail en attendant, on continue W14 en parallèle.**
- **W14 — reste à faire** : staging, pilote.

Options pour la suite tant que W13 reste bloquée :
- Staging / pilote.
- Attendre l'avancement du Dev Backend sur les 43 endpoints OpenAPI pour basculer `NEXT_PUBLIC_API_MODE` vers `"live"` module par module.
- Dès que Hamza fournit le code Cactus : démarrer immédiatement W13.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier.
- Permission correcte (RBAC page + nav + 403 backend attendu).
- États loading/empty/error gérés, annoncés (aria-live).
- Double-submit protégé, refetch réel après mutation.
- Vérifié EN CONDITIONS RÉELLES, deux thèmes, F5, focus clavier visible.
- Lint + build OK.
- Push sur `feature/web-...`, jamais `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552`, accent chaud `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** : à préparer `#F5A623`, en préparation `#2DB4C7`, prête `#22C55E`, problème/alerte `#EF4444`.

**Contraste WCAG — corrigé (W14)** : tokens `-text` dédiés, différents par thème (une seule valeur ne peut pas passer 4.5:1 dans les deux thèmes à la fois) : `status-alert-text` (`#b91c1c` clair / `#fca5a5` sombre), `status-ready-text` (`#166534` / `#4ade80`), `accent-warm-text` (`#c2410c` / `#fdba74`). Tous ≥ 5:1 contre `--surface-raised` (calculé, formule de luminance relative WCAG). Les tokens décoratifs d'origine (`status-alert`, `status-ready`, `accent-warm` — pastilles, bordures, icônes) restent inchangés, seuil 3:1 déjà respecté. `text-text-muted` reste conforme.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature : motif "ticket rail" (pointillés).

**Focus clavier** : anneau `focus-visible` global défini dans `globals.css`, couleur accent marque, ne s'active qu'au clavier.

---

## 7. Ce qui existe déjà (repères pour Claude Code)

**Design / layout (W1)** — `roles.ts`, `role-context.tsx`, `theme-toggle.tsx`, `staff-nav.tsx`, `states/*` (error-state avec `role="alert"`, loading-state avec `aria-live="polite"`), `app/(staff)/layout.tsx`, `require-role.tsx`.

**API / Auth (W2, résilience W14)** — `client.ts` (timeout 8s live, injection de panne mock), `mocks/index.ts`, `error-messages.ts`, `auth-context.tsx`, `network-simulator.ts`, `network-failure-toggle.tsx`.

**Catalogue (W3, enrichi W11)** — `catalogue-types.ts`, `administration/catalogue/page.tsx` (h2 "Produits"), `administration/promotions/page.tsx` (h2 "Promotions actives").

**Orders (W4)** — `orders-types.ts`, `orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7, enrichi W11, idempotent W14)** — `pos-types.ts`, `pos/page.tsx` (session, panier, paiement idempotent, Rush, clôture, impression, scanner branché), `close-session-panel.tsx`, `hardware/scanner.ts`, `printer.ts`.

**KDS (W6)** — `use-order-transition.ts`, `kds/page.tsx`.

**Inventaire (W8, layout corrigé W12)** — `inventory-types.ts`, `stock/page.tsx` (layout deux-lignes, h2 "Alertes stock bas"), `dashboard/stock-alerts-card.tsx`.

**Cantine (W9, a11y W14)** — `canteen-types.ts`, `cantine/page.tsx` (aria-label sur champ code Food Pass).

**Administration (W10, a11y W14)** — `students-types.ts`, `administration/students/page.tsx` (h2 "Liste des étudiants"), `admin-types.ts`, `administration/users/page.tsx` (aria-label dynamique sur select rôle), `administration/audit/page.tsx`.

**Direction (W12)** — `direction-types.ts`, `direction/page.tsx`.

**Tests E2E (W14, étendu)** — `e2e/helpers/auth.ts` (login/setRole réutilisables), `e2e/auth.spec.ts`, `e2e/pos-sale.spec.ts`, `e2e/orders-transition.spec.ts`, `e2e/stock-adjustment.spec.ts`, `e2e/cantine-distribution.spec.ts`, `e2e/role-guard.spec.ts`, `e2e/kds.spec.ts`, `e2e/promotions.spec.ts`, `e2e/direction-kpi.spec.ts`, `e2e/users-role-change.spec.ts`, `e2e/students-management.spec.ts`, `playwright.config.ts` (chromium seul, `fullyParallel: true`, `webServer` auto-lance `npm run dev`).

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (aucune — dernière branche mergée: feature/web-e2e-extended-contrast-fix)
Current milestone: W0-W12 complets + résilience réseau + accessibilité (contrastes inclus) + tests E2E étendus (portions W14). W13 BLOQUÉE (Hamza fournira le code Cactus quand disponible).
Completed:
- W0-W12: voir historique
- Résilience réseau (W14 anticipé): simulation de panne, timeout 8s, idempotence POS — mergé
- Accessibilité (W14 anticipé): focus-visible global, aria-labels, live regions, h2 manquants — mergé
- Contrastes WCAG (W14 anticipé): tokens -text par thème pour alert/ready/accent-warm, appliqués aux usages texte uniquement — mergé
- Tests E2E (W14 anticipé, étendu): Playwright, 13 tests, 11 flux critiques (+ kds, promotions, direction-kpi, users-role-change, students-management) — mergé. Commande: npm run test:e2e
Validated:
- lint: OK
- build: OK
- e2e: 13/13 passing
Backend dependencies:
- ready: PostgreSQL/Flyway opérationnels
- pending: JWT/RBAC réel, 43 endpoints OpenAPI (partiels), accès code Cactus, matériel réel
Open decisions:
- W13 en pause — Hamza apportera le code Cactus quand il l'aura ; le reste du travail continue sans attendre
- Idempotence POS: nom de champ à confirmer avec Dev Backend (body vs header Idempotency-Key)
- Scénario "serveur a réussi mais réponse perdue" non testable avec mocks actuels
- Piège E2E n°1: page.goto() réinitialise les mocks en mémoire — toujours naviguer via <Link> client-side entre deux étapes d'un même test qui partagent un état créé en cours de test
- Piège E2E n°2: après un clic sur un <Link> client-side, ne pas enchaîner directement sur une assertion getByText/getByRole ambiguë sur l'ancienne page — un page.waitForURL() ou une action qui n'existe que sur la page cible évite l'échec (strict mode violation non retryable)
- Auth 100% mock; ORDER_TRANSITIONS propositions frontend; POS crée en PAID direct; KDS en polling; déduction stock au PREPARING non connectée; ordersByPaymentMethod non calculable; acteur audit = placeholder
Next exact action:
- Quand Hamza fournit le code Cactus: démarrer W13
- En attendant: staging/pilote, ou attendre avancement Dev Backend pour NEXT_PUBLIC_API_MODE="live" module par module
```

*(Ce bloc doit être mis à jour à chaque étape validée.)*