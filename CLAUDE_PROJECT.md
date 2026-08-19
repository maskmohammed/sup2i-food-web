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
- Bloquer le double clic/double soumission sur : paiement, distribution Cantine, clôture caisse, remboursement, ajustement stock, création catalogue, transition de commande, ouverture session caisse.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur (jamais de mise à jour optimiste non confirmée sur ces flux).
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma.
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/typecheck/tests/build.
- Prix stockés en centimes (`priceCents`), jamais en float — conversion DH uniquement à l'affichage.
- Le total d'un panier/commande vient toujours d'un round-trip serveur, jamais d'un sum() local, même en mock.
- Une impression échouée n'est jamais traitée comme un paiement échoué — le paiement reste validé, avertissement discret seulement.
- Ne jamais inventer un mapping (ex. code-barres→produit) sans champ réel disponible — documenter l'absence plutôt que de bricoler une correspondance arbitraire.

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
- Push vers `origin feature/web-...`, merge vers `develop` (en local via `git merge` si l'UI GitHub bloque/est lente — jamais vers `main`).
- Avant tout `git checkout` de branche, arrêter `npm run dev` (`Get-Process node | Stop-Process -Force`) pour éviter les blocages de suppression de dossiers sous Windows.

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

Ne jamais sauter plusieurs étapes d'un coup. Ne jamais scaffolder/modifier en masse sans inspection préalable. Les étapes larges sont découpées en sous-étapes (ex. W2.1/W2.2, W5.1/W5.2, W7.1/W7.2) — continuer ce découpage pour W8 et W10.

---

## 4. Roadmap W0 → W14

- **W0 — Audit repo** ✅
- **W1 — Shell / Design / RBAC** ✅
- **W2 — API / Auth / Erreurs** ✅
- **W3 — Catalogue + premier vertical slice** ✅ *(page catalogue accessible par URL même hors rôle autorisé — reporté à W10)*
- **W4 — Orders dashboard** ✅
- **W5 — POS MVP** ✅
- **W6 — KDS** ✅
- **W7 — POS Rush / Clôture / Matériel** ✅ *(terminé : mode Rush, clôture de session avec écarts et motif obligatoire, adapters scanner keyboard-wedge + imprimante mock. Scan→panier non implémenté faute de champ barcode sur Product — à revoir dès qu'il existera côté catalogue)*
- **W8 — Inventory / Waste** *(prochaine étape)* : stock, mouvements, réceptions, comptages, ajustements, alertes, gaspillage.
- **W9 — Cantine / Food Pass staff** : menus, scan Food Pass, quota, distribution, anti-double scan.
- **W10 — Administration** : étudiants, photo, abonnements, cartes, users, rôles, configuration, audit. *(inclut la protection par rôle au niveau page pour catalogue, pas seulement nav)*
- **W11 — Snack / Promotions avancé** : options produits, codes-barres, disponibilité, promotions. *(ajoutera potentiellement le champ barcode sur Product, qui débloquerait le scan→panier de W7)*
- **W12 — Direction / Finance** : KPI ventes, marge estimée, cantine, stock, gaspillage, adoption, exports.
- **W13 — Cactus / Matériel — audit d'intégration** : dès que code Cactus et matériel réel disponibles. *(validera aussi le vrai comportement du scanner keyboard-wedge et le choix d'intégration imprimante)*
- **W14 — Hardening / Pilote** : E2E, sécurité, perf, a11y, résilience réseau, staging, pilote.

Ne jamais sauter à une étape avancée (ex. W12) parce qu'elle est visuellement gratifiante — chaque étape dépend de la précédente.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier (state machine, permissions).
- Endpoint/contrat correct (ou mock explicitement marqué comme tel).
- Permission correcte (RBAC frontend + attente 403 backend).
- États loading / empty / error (par `code`) / succès gérés — réutiliser les composants `src/components/states/*`.
- Double-submit protégé si action critique.
- Données rafraîchies depuis le serveur après mutation (refetch réel, pas juste ajout local optimiste).
- `npm run dev` vérifié visuellement par Hamza (design, couleurs, comportement, y compris thème sombre après F5).
- Lint + typecheck + build OK.
- Aucun secret commité.
- Push sur `feature/web-...`, jamais sur `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552` (magenta, issu du dégradé du logo SUP2I), accent chaud secondaire `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** : à préparer/QUEUED `#F5A623`, en préparation/PREPARING `#2DB4C7`, prête/READY `#22C55E`, problème/annulé `#EF4444`.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature visuelle : motif "ticket rail" (pointillés) entre nav et contenu.

**Note responsive** : toute grille de cartes utilise `auto-fill`/`minmax`, jamais un nombre de colonnes fixe.

---

## 7. Ce qui existe déjà (repères pour Claude Code)

**Design / layout (W1)** — `src/lib/roles.ts`, `role-context.tsx`, `role-switcher.tsx`, `theme-toggle.tsx`, `staff-nav.tsx`, `states/*` (loading/empty/error), `app/(staff)/layout.tsx`.

**API / Auth (W2)** — `src/lib/api/types.ts`, `client.ts` (`apiFetch<T>`, mock/live via `NEXT_PUBLIC_API_MODE`), `mocks/index.ts` (registre mock complet, état en mémoire réinitialisé au reload), `use-api.ts`, `error-messages.ts` (17 codes FR), `auth/auth-context.tsx` (100% mock).

**Catalogue (W3)** — `src/lib/api/catalogue-types.ts`, `app/(staff)/administration/catalogue/page.tsx`. **Page non gardée par rôle — reporté à W10.**

**Orders dashboard (W4)** — `src/lib/api/orders-types.ts` (state machine + rôles, propositions à valider avec le Dev Backend), `app/(staff)/orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7)**
- `src/lib/api/pos-types.ts` — `CartItem`, `CartPriceResult`, `CashSession`, `PaymentMethod`, `CreatedOrder`, `CashSessionClosure`, `CashSessionSummary`.
- `src/app/(staff)/pos/page.tsx` — garde de session, grille produit responsive, panier + total serveur, paiement CASH/TPE, ticket, mode Rush (toggle, paiement direct, bouton "Suivant"), bouton "Clôturer la session", bouton "Imprimer le ticket".
- `src/app/(staff)/pos/close-session-panel.tsx` — clôture avec résumé serveur, motif obligatoire si écart (`CASH_DIFFERENCE_REASON_REQUIRED`).
- Commande créée directement en `PAID` (simplification MVP, pas d'`AWAITING_PAYMENT`).

**KDS (W6)** — `src/lib/api/use-order-transition.ts` (hook partagé avec `/orders/[id]`), `app/(staff)/kds/page.tsx` (colonnes, polling 6s).

**Matériel (W7.2)** — `src/lib/hardware/scanner.ts` (`ScannerAdapter`, implémentation réelle keyboard-wedge, **non branché** au POS faute de champ barcode sur `Product`), `src/lib/hardware/printer.ts` (`PrinterAdapter`, `MockPrinterAdapter`, log console "Impression simulée").

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (à définir pour W8)
Current milestone: W7 — POS Rush / Clôture / Matériel ✅ TERMINÉ. Prochaine étape : W8 — Inventory / Waste
Completed:
- W0-W6: voir historique
- W7.1: mode Rush + clôture session avec écarts — mergé sur develop
- W7.2: adapters scanner (keyboard-wedge, non branché) + imprimante (mock) — mergé sur develop
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
- Page /administration/catalogue accessible par URL directe sans garde de rôle — reporté à W10
- ORDER_TRANSITIONS et ORDER_TRANSITION_ROLES sont des propositions frontend — à confirmer avec le Dev Backend
- Commande POS créée directement en PAID (pas d'AWAITING_PAYMENT) — à revoir avec le vrai flux backend/TPE
- KDS en polling (6s) plutôt que WebSocket/SSE
- Scan→panier non implémenté : Product n'a pas de champ barcode — à revoir en W11 (Snack/Promotions avancé)
- Imprimante = mock console uniquement — vraie intégration à décider en W13 selon matériel réel
Next exact action:
- Démarrer W8: Inventory/Waste — items de stock, mouvements, réceptions, comptages, ajustements, alertes seuil bas, gaspillage
```

*(Ce bloc doit être mis à jour à chaque étape validée — ne jamais écrire "terminé" sans exécution réelle des validations.)*