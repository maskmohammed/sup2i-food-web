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
- Ne jamais accepter comme vérité un total/prix/stock calculé côté client — le serveur revalide toujours.
- Ne jamais implémenter une transition d'état absente de la state machine des commandes.
- Décider le comportement UI avec `error.code`, jamais avec le texte `message`.
- Bloquer le double clic/double soumission sur toute action critique.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur.
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma. **Cactus = framework PHP maison de l'école, système de caisse existant à auditer en W13.**
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/build ET testé en conditions réelles.
- Prix stockés en centimes, jamais en float.
- Le total d'un panier/commande vient toujours d'un round-trip serveur.
- Une impression échouée n'est jamais traitée comme un paiement échoué.
- Ne jamais inventer un mapping/champ/donnée sans base réelle — dire "non calculable"/"non disponible" plutôt que fabriquer.
- Ne jamais utiliser "profit"/"bénéfice net" — valorisation stock/gaspillage toujours labellisée "estimation".
- Dans toute rangée avec texte tronqué : vérifier que toutes les colonnes fixes combinées ne dépassent jamais la largeur disponible (préférer un layout multi-lignes si nom+badges+actions se combinent).
- Toute règle métier bloquante vérifiée UI ET serveur.
- Toute page sensible enveloppée par `RequireRole`.
- Les mocks sont en mémoire uniquement — F5/nouvel onglet réinitialise l'état, c'est attendu.
- Toute mutation critique (paiement notamment) doit être idempotente côté client via une clé générée avant l'appel, réutilisée si retry après échec réseau — pattern posé en W14 anticipé sur le POS, à généraliser si besoin.

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

**Méthode de debug** (rodée en W12) : bug visuel qui persiste malgré code vérifié correct → (1) purger `.next` + redémarrer, (2) `console.log` temporaire pour confirmer la donnée au runtime, (3) si donnée correcte, inspecter le DOM réel via DevTools (Computed/Styles) plutôt que deviner dans le code.

---

## 4. Roadmap W0 → W14

- **W0 à W12** ✅ TOUS TERMINÉS (voir historique : shell/design, auth/API, catalogue, orders, POS, KDS, stock, cantine, administration, promotions/scanner, direction/finance).
- **Portion de W14 anticipée** ✅ : simulation de panne réseau (`network-simulator.ts`, toggle dev), timeout réel 8s en mode live, clé d'idempotence sur le paiement POS pour éviter les doubles commandes en cas de retry réseau.
- **W13 — Cactus / Matériel — audit d'intégration** — **BLOQUÉE, en attente d'accès externe** : nécessite le code source du framework Cactus (PHP, développé par l'école) et le matériel physique du système de caisse existant (scanner, imprimante, TPE). Pas un choix de priorisation — Hamza n'a pas encore cet accès.
- **W14 — Hardening / Pilote** *(partiellement anticipé, reste à faire)* : E2E, a11y, reste de la résilience réseau si besoin, staging, pilote.

Options pour la suite tant que W13 reste bloquée :
- Continuer W14 : accessibilité (a11y) sur les écrans existants, tests E2E des flux mock.
- Attendre l'avancement du Dev Backend sur les 43 endpoints OpenAPI pour commencer à basculer `NEXT_PUBLIC_API_MODE` vers `"live"` module par module.
- Faire le point avec l'équipe (Dev Backend, Dev Mobile) sur l'accès à Cactus/matériel.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier.
- Permission correcte (RBAC page + nav + 403 backend attendu).
- États loading/empty/error gérés.
- Double-submit protégé, refetch réel après mutation.
- Vérifié EN CONDITIONS RÉELLES, deux thèmes, F5.
- Lint + build OK.
- Push sur `feature/web-...`, jamais `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552`, accent chaud `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** : à préparer `#F5A623`, en préparation `#2DB4C7`, prête `#22C55E`, problème/alerte `#EF4444`.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature : motif "ticket rail" (pointillés).

---

## 7. Ce qui existe déjà (repères pour Claude Code)

**Design / layout (W1)** — `roles.ts`, `role-context.tsx`, `theme-toggle.tsx`, `staff-nav.tsx`, `states/*`, `app/(staff)/layout.tsx`, `require-role.tsx` (W10).

**API / Auth (W2, résilience W14)** — `client.ts` (timeout 8s live, injection de panne mock), `mocks/index.ts`, `error-messages.ts` (`NETWORK_ERROR` inclus), `auth-context.tsx` (100% mock), `network-simulator.ts`, `network-failure-toggle.tsx` (toggle dev dans le header staff).

**Catalogue (W3, enrichi W11)** — `catalogue-types.ts` (barcode, options, Promotion), `administration/catalogue/page.tsx`, `administration/promotions/page.tsx`.

**Orders (W4)** — `orders-types.ts`, `orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7, enrichi W11, idempotent W14)** — `pos-types.ts`, `pos/page.tsx` (session, panier, paiement avec clé d'idempotence générée/réutilisée par panier, Rush, clôture, impression, scanner branché), `close-session-panel.tsx`, `hardware/scanner.ts`, `printer.ts`.

**KDS (W6)** — `use-order-transition.ts`, `kds/page.tsx`.

**Inventaire (W8, layout corrigé W12)** — `inventory-types.ts`, `stock/page.tsx` (layout deux-lignes anti-débordement), `dashboard/stock-alerts-card.tsx`.

**Cantine (W9)** — `canteen-types.ts`, `cantine/page.tsx`.

**Administration (W10)** — `students-types.ts`, `administration/students/page.tsx`, `admin-types.ts`, `administration/users/page.tsx`, `administration/audit/page.tsx`.

**Direction (W12)** — `direction-types.ts`, `direction/page.tsx` (KPI honnêtes, `ordersByPaymentMethod` omis car non calculable).

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (aucune — dernière branche mergée: feature/web-network-resilience)
Current milestone: W0-W12 complets + portion résilience réseau de W14 anticipée. W13 BLOQUÉE (accès Cactus/matériel manquant).
Completed:
- W0-W12: voir historique
- Résilience réseau (W14 anticipé): simulation de panne dev, timeout réel 8s, clé d'idempotence POS — mergé sur develop
Validated:
- lint: OK
- build: OK
Backend dependencies:
- ready: PostgreSQL/Flyway opérationnels
- pending: JWT/RBAC réel, 43 endpoints OpenAPI (partiels), accès code Cactus (PHP, framework école), matériel réel (scanner/imprimante/TPE)
Open decisions:
- W13 BLOQUÉE — dépend de l'accès à Cactus et au matériel physique, pas du rythme de dev
- Idempotence POS: nom de champ (idempotencyKey en body) proposé, convention REST standard serait un header Idempotency-Key — à confirmer avec Dev Backend
- Scénario "serveur a réussi mais réponse perdue" non testable avec les mocks actuels — mécanisme de déduplication en place mais jamais éprouvé en conditions réelles de perte réseau
- Auth 100% mock; ORDER_TRANSITIONS propositions frontend; POS crée en PAID direct; KDS en polling; déduction stock au PREPARING non connectée; ordersByPaymentMethod non calculable; acteur audit = placeholder
Next exact action:
- Si accès Cactus/matériel obtenu: démarrer W13
- Sinon: continuer W14 — accessibilité (a11y) des écrans existants, ou tests E2E des flux mock, ou attendre avancement Dev Backend pour basculer NEXT_PUBLIC_API_MODE vers "live" module par module
```

*(Ce bloc doit être mis à jour à chaque étape validée.)*