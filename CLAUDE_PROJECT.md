# CLAUDE.md — sup2i-food-web

> Ce fichier est lu par Claude Code à chaque session dans ce repo. Il fixe le contexte, les règles non négociables et la roadmap. Ne jamais s'en écarter sans décision explicite du responsable Web (Hamza).

---

## 0. Rôle

Tu es l'assistant de développement du repo **sup2i-food-web** (Next.js/React), au sein d'une équipe de 3 devs :

- Dev Mobile → `sup2i-food-mobile` (Flutter)
- Dev Backend → `sup2i-food-backend` (Spring Boot / PostgreSQL)
- **Hamza (moi)** → `sup2i-food-web`, responsable complet de ce repo

Le backend Spring Boot + PostgreSQL est l'unique source de vérité métier (auth, permissions, prix, stock, quotas, transitions de commande, paiements). Le Web est un **client**, jamais un second backend.

---

## 1. Règles absolues — ne jamais enfreindre

- Ne jamais coder directement sur `main`.
- Ne jamais connecter le navigateur/Next.js directement à PostgreSQL.
- Ne jamais accepter comme vérité un total/prix/stock calculé côté client — le serveur revalide toujours, promotions incluses.
- Ne jamais implémenter une transition d'état absente de la state machine des commandes.
- Décider le comportement UI avec `error.code`, jamais avec le texte `message`.
- Bloquer le double clic/double soumission sur toute action critique (paiement, distribution, clôture, stock, catalogue, commandes, session, étudiants, users, promotions).
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur.
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma.
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/typecheck/tests/build ET testé en conditions réelles (pas seulement par lecture de code).
- Prix stockés en centimes, jamais en float.
- Le total d'un panier/commande vient toujours d'un round-trip serveur, y compris les réductions de promotions.
- Une impression échouée n'est jamais traitée comme un paiement échoué.
- Ne jamais inventer un mapping sans champ réel disponible.
- Dans toute rangée flex avec du texte tronqué : `flex-1` sur le texte.
- Toute règle métier bloquante doit être vérifiée UI ET serveur.
- La photo étudiante n'est jamais modifiable depuis Cantine.
- Toute page Administration/Stock/Catalogue sensible doit être enveloppée par `RequireRole`.
- Les mocks sont en mémoire uniquement — un F5/nouvel onglet réinitialise l'état, c'est attendu.

---

## 2. Workflow Git obligatoire

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/web-<nom-etape>
```

- Travailler uniquement sur des branches `feature/web-...`.
- Jamais de push direct sur `main`. Jamais de push direct sur `develop` sans validation locale complète.
- Avant tout push : `npm run lint`, `npm run typecheck`, `npm run build`.
- Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Merge vers `develop` en local via `git merge` (jamais vers `main`).
- Avant tout `git checkout` de branche, arrêter `npm run dev`.

---

## 3. Méthode de travail — une étape à la fois

1. Claude Code explique le but de l'étape.
2. Claude Code propose les commandes/fichiers exacts.
3. Vérification visuelle réelle (clics effectifs, deux thèmes, F5).
4. Lint/typecheck/build OK.
5. Commit → push → merge vers `develop`.
6. Mise à jour `CURRENT_STATUS`.
7. Étape suivante seulement après validation explicite.

Les étapes larges sont découpées en sous-étapes.

---

## 4. Roadmap W0 → W14

- **W0 — Audit repo** ✅
- **W1 — Shell / Design / RBAC** ✅
- **W2 — API / Auth / Erreurs** ✅
- **W3 — Catalogue + premier vertical slice** ✅
- **W4 — Orders dashboard** ✅
- **W5 — POS MVP** ✅
- **W6 — KDS** ✅
- **W7 — POS Rush / Clôture / Matériel** ✅
- **W8 — Inventory / Waste** ✅
- **W9 — Cantine / Food Pass staff** ✅
- **W10 — Administration** ✅
- **W11 — Snack / Promotions avancé** ✅ *(terminé : barcode/options produits, promotions avec réduction calculée serveur dans /pos/cart/price, scanner keyboard-wedge de W7 enfin branché sur /pos — TODO fermé)*
- **W12 — Direction / Finance** *(prochaine étape)* : KPI ventes, marge estimée, cantine, stock, gaspillage, adoption, exports.
- **W13 — Cactus / Matériel — audit d'intégration** : dès que code Cactus et matériel réel disponibles.
- **W14 — Hardening / Pilote** : E2E, sécurité, perf, a11y, résilience réseau, staging, pilote.

Ne jamais sauter à une étape avancée parce qu'elle est visuellement gratifiante.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier.
- Endpoint/contrat correct (ou mock marqué comme tel).
- Permission correcte (RBAC page + nav + attente 403 backend).
- États loading / empty / error gérés.
- Double-submit protégé.
- Refetch réel après mutation.
- Vérifié visuellement EN CONDITIONS RÉELLES, deux thèmes, F5.
- Rangées flex : `flex-1` sur le texte.
- Lint + typecheck + build OK.
- Aucun secret commité.
- Push sur `feature/web-...`, jamais `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552`, accent chaud secondaire `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** : à préparer `#F5A623`, en préparation `#2DB4C7`, prête `#22C55E`, problème/alerte `#EF4444`.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature : motif "ticket rail" (pointillés).

---

## 7. Ce qui existe déjà (repères pour Claude Code)

**Design / layout (W1)** — `roles.ts`, `role-context.tsx`, `role-switcher.tsx`, `theme-toggle.tsx`, `staff-nav.tsx`, `states/*`, `app/(staff)/layout.tsx`.

**API / Auth (W2)** — `api/types.ts`, `client.ts`, `mocks/index.ts`, `use-api.ts`, `error-messages.ts`, `auth/auth-context.tsx` (100% mock).

**Catalogue (W3, enrichi W11)** — `catalogue-types.ts` (`Product` avec `barcode`, `options`, `available`), `Promotion`, `app/(staff)/administration/catalogue/page.tsx` (barcode, toggle disponibilité), `app/(staff)/administration/promotions/page.tsx`. Gardées par `RequireRole`.

**Orders (W4)** — `orders-types.ts`, `app/(staff)/orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7, enrichi W11)** — `pos-types.ts`, `app/(staff)/pos/page.tsx` (session, panier, paiement, ticket, mode Rush, clôture, impression, **scanner branché** ajoutant automatiquement au panier via `useKeyboardWedgeScanner`), `close-session-panel.tsx`, `src/lib/hardware/scanner.ts` (branché depuis W11), `printer.ts` (mock). Prix promotionnel calculé exclusivement dans `POST /api/v1/pos/cart/price`.

**KDS (W6)** — `use-order-transition.ts`, `app/(staff)/kds/page.tsx`.

**Inventaire (W8)** — `inventory-types.ts`, `app/(staff)/stock/page.tsx`, `dashboard/stock-alerts-card.tsx`.

**Cantine (W9)** — `canteen-types.ts`, `app/(staff)/cantine/page.tsx`.

**Administration (W10)**
- `src/components/require-role.tsx` — `RequireRole`, réutilisable.
- `students-types.ts`, `app/(staff)/administration/students/page.tsx` — source partagée avec Cantine.
- `admin-types.ts`, `app/(staff)/administration/users/page.tsx`, `administration/audit/page.tsx` — journal alimenté par `recordAudit()` sur 8 actions du système.

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (à définir pour W12)
Current milestone: W11 — Snack / Promotions avancé ✅ TERMINÉ. Prochaine étape : W12 — Direction / Finance
Completed:
- W0-W10: voir historique
- W11: barcode/options produits, promotions (réduction calculée serveur), scanner branché sur POS (ferme TODO W7) — mergé sur develop
Validated:
- lint: OK
- typecheck: OK (via build)
- tests: -
- build: OK
Backend dependencies:
- ready: PostgreSQL/Flyway opérationnels, Organization/Campus/Location compilent
- pending: JWT/RBAC réel, endpoints métier (43 paths cibles, pas tous implémentés)
Open decisions:
- Cactus/PHP: audit non démarré
- Auth actuelle 100% mock — à remplacer par vrai JWT/refresh backend
- ORDER_TRANSITIONS et ORDER_TRANSITION_ROLES sont des propositions frontend — à confirmer avec le Dev Backend
- Commande POS créée directement en PAID (pas d'AWAITING_PAYMENT)
- KDS en polling (6s) plutôt que WebSocket/SSE
- Imprimante = mock console uniquement — vraie intégration à décider en W13
- Déduction automatique de stock au PREPARING non connectée — TODO explicite
- Acteur de l'audit log = placeholder générique, pas encore relié à l'auth réelle
Next exact action:
- Démarrer W12: KPI ventes, panier moyen, mobile vs direct, modes paiement, cantine, stock, marge matière estimée (jamais présentée comme bénéfice net), gaspillage, exports
```

*(Ce bloc doit être mis à jour à chaque étape validée — ne jamais écrire "terminé" sans exécution réelle des validations.)*