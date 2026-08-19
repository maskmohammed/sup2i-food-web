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
- Ne jamais accepter comme vérité un total/prix/stock calculé côté client — le serveur revalide toujours.
- Ne jamais implémenter une transition d'état absente de la state machine des commandes.
- Décider le comportement UI avec `error.code`, jamais avec le texte `message`.
- Bloquer le double clic/double soumission sur : paiement, distribution Cantine, clôture caisse, remboursement, ajustement stock.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur (jamais de mise à jour optimiste non confirmée sur ces flux).
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma.
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/typecheck/tests/build.

---

## 2. Workflow Git obligatoire

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/web-<nom-etape>
```

- Travailler uniquement sur des branches `feature/web-...` (ou `fix/`, `test/`, `refactor/`).
- Jamais de push direct sur `main`. Jamais de push direct sur `develop` sans validation locale complète.
- Avant tout push : `npm run lint`, `npm run typecheck` (ou `tsc --noEmit`), `npm run build`.
- Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Push vers `origin feature/web-...`, merge vers `develop` (localement si l'UI GitHub bloque, jamais vers `main`).

---

## 3. Méthode de travail — une étape à la fois

Pour chaque étape de la roadmap :

1. Claude Code explique brièvement le but de l'étape.
2. Claude Code propose les commandes/fichiers exacts.
3. Hamza exécute et lance `npm run dev` pour vérifier visuellement (design, couleurs, comportement) — y compris les deux thèmes clair/sombre après rechargement (`F5`).
4. Vérification ensemble : rendu correct, pas d'erreur console, lint/typecheck/build OK.
5. Une fois validé → commit → push sur la branche `feature/web-...` → merge vers `develop` (jamais `main`).
6. Mise à jour du bloc `CURRENT_STATUS` ci-dessous.
7. Passage à l'étape suivante seulement après validation explicite de Hamza.

Ne jamais sauter plusieurs étapes d'un coup. Ne jamais scaffolder/modifier en masse sans inspection préalable.

---

## 4. Roadmap W0 → W14

- **W0 — Audit repo** ✅ *(terminé : repo quasi vide, `develop`/`main` identiques, Node v24.14.1, npm 11.11.0)*
- **W1 — Shell / Design / RBAC** : scaffold Next.js ✅, design tokens + layout + login ✅, navigation par rôle + états loading/error/empty (en cours).
- **W2 — API / Auth / Erreurs** : client API typé, auth + refresh token, mapping `error.code`, mocks alignés sur l'OpenAPI (43 paths cibles).
- **W3 — Catalogue + premier vertical slice** : Admin crée un produit → API/DB → visible côté Mobile.
- **W4 — Orders dashboard** : liste/détail des commandes, états, actions selon permissions.
- **W5 — POS MVP** : session caisse, scanner universel, panier, QR commande, paiement CASH/TPE, ticket.
- **W6 — KDS** : file des commandes payées, Commencer/Prête, temps réel.
- **W7 — POS Rush / Clôture / Matériel** : mode Rush, clôture avec écarts, impression réelle, scanner physique.
- **W8 — Inventory / Waste** : stock, mouvements, réceptions, comptages, ajustements, alertes, gaspillage.
- **W9 — Cantine / Food Pass staff** : menus, scan Food Pass, quota, distribution, anti-double scan.
- **W10 — Administration** : étudiants, photo, abonnements, cartes, users, rôles, configuration, audit.
- **W11 — Snack / Promotions avancé** : options produits, codes-barres, disponibilité, promotions.
- **W12 — Direction / Finance** : KPI ventes, marge estimée, cantine, stock, gaspillage, adoption, exports.
- **W13 — Cactus / Matériel — audit d'intégration** : dès que code Cactus et matériel réel disponibles.
- **W14 — Hardening / Pilote** : E2E, sécurité, perf, a11y, résilience réseau, staging, pilote.

Ne jamais sauter à une étape avancée (ex. W12) parce qu'elle est visuellement gratifiante — chaque étape dépend de la précédente.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier (state machine, permissions).
- Endpoint/contrat correct (ou mock explicitement marqué comme tel).
- Permission correcte (RBAC frontend + attente 403 backend).
- États loading / empty / error (par `code`) / succès gérés.
- Double-submit protégé si action critique.
- Données rafraîchies depuis le serveur après mutation.
- `npm run dev` vérifié visuellement par Hamza (design, couleurs, comportement, y compris thème sombre après F5).
- Lint + typecheck + build OK.
- Aucun secret commité.
- Push sur `feature/web-...`, jamais sur `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552` (magenta), accent chaud secondaire `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** (identiques dans les deux thèmes) : à préparer `#F5A623`, en préparation `#2DB4C7`, prête `#22C55E`, problème/annulé `#EF4444`.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature visuelle : motif "ticket rail" (séparation en pointillés) entre nav et contenu.

---

## 7. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web
Base branch: develop
Working branch: (à définir pour W1.3)
Current milestone: W1 — Shell / Design / RBAC (tokens + layout + login faits, reste navigation par rôle + états loading/error/empty)
Completed:
- W0: audit repo terminé
- Scaffold Next.js (TypeScript, App Router, src/, Tailwind, alias @/*) — mergé sur develop
- Design tokens (couleurs v3 marine/magenta, IBM Plex Sans/Mono) + layout staff + toggle thème sombre/clair persistant + login shell — mergé sur develop
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
Next exact action:
- W1.3: navigation filtrée par rôle (rôles simulés) + composants loading/error/empty réutilisables
```

*(Ce bloc doit être mis à jour à chaque étape validée — ne jamais écrire "terminé" sans exécution réelle des validations.)*