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
- Bloquer le double clic/double soumission sur : paiement, distribution Cantine, clôture caisse, remboursement, ajustement stock, réception, gaspillage, création catalogue, transition de commande, ouverture session caisse, création étudiant, bascule abonnement, changement de rôle/statut utilisateur.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur (jamais de mise à jour optimiste non confirmée sur ces flux).
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma.
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/typecheck/tests/build ET testé en conditions réelles (pas seulement par lecture de code).
- Prix stockés en centimes (`priceCents`), jamais en float — conversion DH uniquement à l'affichage.
- Le total d'un panier/commande vient toujours d'un round-trip serveur, jamais d'un sum() local, même en mock.
- Une impression échouée n'est jamais traitée comme un paiement échoué — le paiement reste validé, avertissement discret seulement.
- Ne jamais inventer un mapping (ex. code-barres→produit) sans champ réel disponible.
- Dans toute rangée flex avec du texte tronqué : donner `flex-1` à l'élément texte.
- Toute règle métier bloquante doit être vérifiée UI ET serveur (défense en profondeur).
- La photo étudiante n'est jamais modifiable depuis l'écran Cantine — modification réservée à Administration.
- Toute page Administration/Stock/Catalogue sensible doit être enveloppée par `RequireRole` (garde au niveau page), pas seulement filtrée dans la nav.
- Les mocks sont en mémoire uniquement (pas de persistance réelle) — un F5/nouvel onglet réinitialise l'état au seed initial ; c'est un comportement attendu, pas un bug, tant que le vrai backend n'est pas branché.

---

## 2. Workflow Git obligatoire

```powershell
git checkout develop
git pull origin develop
git checkout -b feature/web-<nom-etape>
```

- Travailler uniquement sur des branches `feature/web-...`.
- Jamais de push direct sur `main`. Jamais de push direct sur `develop` sans validation locale complète.
- Avant tout push : `npm run lint`, `npm run typecheck` (ou `tsc --noEmit`), `npm run build`.
- Commits : `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Push vers `origin feature/web-...`, merge vers `develop` (en local via `git merge` si l'UI GitHub bloque/est lente — jamais vers `main`).
- Avant tout `git checkout` de branche, arrêter `npm run dev` (`Get-Process node | Stop-Process -Force`).

---

## 3. Méthode de travail — une étape à la fois

Pour chaque étape :

1. Claude Code explique brièvement le but de l'étape.
2. Claude Code propose les commandes/fichiers exacts.
3. Hamza exécute et lance `npm run dev` pour vérifier visuellement, y compris les deux thèmes après F5.
4. Vérification ensemble : rendu correct, pas d'erreur console, lint/typecheck/build OK.
5. Une fois validé → commit → push → merge vers `develop` (jamais `main`).
6. Mise à jour du bloc `CURRENT_STATUS` ci-dessous.
7. Passage à l'étape suivante seulement après validation explicite.

Les étapes larges sont découpées en sous-étapes (ex. W2.1/W2.2, W10.1/W10.2/W10.3) — continuer pour W12 notamment.

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
- **W10 — Administration** ✅ *(terminé : W10.1 garde par rôle réutilisable RequireRole appliquée à catalogue+stock ; W10.2 gestion étudiants/photo/abonnements, source unique partagée avec Cantine ; W10.3 users/rôles + journal d'audit branché sur 8 actions existantes du système)*
- **W11 — Snack / Promotions avancé** *(prochaine étape)* : options produits, codes-barres, disponibilité, promotions. *(ajoutera le champ barcode sur Product, débloquant le scan→panier préparé en W7)*
- **W12 — Direction / Finance** : KPI ventes, marge estimée, cantine, stock, gaspillage, adoption, exports.
- **W13 — Cactus / Matériel — audit d'intégration** : dès que code Cactus et matériel réel disponibles.
- **W14 — Hardening / Pilote** : E2E, sécurité, perf, a11y, résilience réseau, staging, pilote.

Ne jamais sauter à une étape avancée parce qu'elle est visuellement gratifiante.

---

## 5. Definition of Done (par étape/feature)

- Comportement conforme à la règle métier (state machine, permissions).
- Endpoint/contrat correct (ou mock explicitement marqué comme tel).
- Permission correcte (RBAC frontend au niveau page ET nav + attente 403 backend).
- États loading / empty / error (par `code`) / succès gérés.
- Double-submit protégé si action critique.
- Données rafraîchies depuis le serveur après mutation.
- `npm run dev` vérifié visuellement, y compris thème sombre après F5, EN CONDITIONS RÉELLES (clics effectifs, pas seulement lecture de code).
- Rangées flex avec texte : `flex-1` sur le texte.
- Lint + typecheck + build OK.
- Aucun secret commité.
- Push sur `feature/web-...`, jamais sur `main`.

---

## 6. Design tokens (référence — v3, confirmée)

**Sombre** : fond `#16283F`, surface `#1E3352`, surface élevée `#274064`, bordure `#3A5478`, texte `#F5F7FA`, texte secondaire `#A9B7CC`, accent marque `#B01552` (magenta, dégradé du logo SUP2I), accent chaud secondaire `#E8542A`.

**Clair** : fond `#F5F7FA`, surface `#FFFFFF`, bordure `#D8E0EC`, texte `#16283F`, texte secondaire `#5C6B85`, accent marque `#B01552`.

**Statuts** : à préparer/QUEUED `#F5A623`, en préparation/PREPARING `#2DB4C7`, prête/READY `#22C55E`, problème/annulé/stock bas/inactif `#EF4444`.

**Typo** : IBM Plex Sans (UI), IBM Plex Mono (données/codes/montants). Signature : motif "ticket rail" (pointillés).

---

## 7. Ce qui existe déjà (repères pour Claude Code)

**Design / layout (W1)** — `roles.ts`, `role-context.tsx`, `role-switcher.tsx`, `theme-toggle.tsx`, `staff-nav.tsx`, `states/*`, `app/(staff)/layout.tsx`.

**API / Auth (W2)** — `api/types.ts`, `client.ts`, `mocks/index.ts`, `use-api.ts`, `error-messages.ts` (19 codes), `auth/auth-context.tsx` (100% mock).

**Catalogue (W3)** — `catalogue-types.ts`, `app/(staff)/administration/catalogue/page.tsx`. Gardée par `RequireRole` (W10.1).

**Orders (W4)** — `orders-types.ts`, `app/(staff)/orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7)** — `pos-types.ts`, `app/(staff)/pos/page.tsx`, `close-session-panel.tsx`, `src/lib/hardware/scanner.ts` (non branché), `printer.ts` (mock).

**KDS (W6)** — `use-order-transition.ts`, `app/(staff)/kds/page.tsx`.

**Inventaire (W8)** — `inventory-types.ts`, `app/(staff)/stock/page.tsx` (gardée W10.1), `dashboard/stock-alerts-card.tsx`.

**Cantine (W9)** — `canteen-types.ts` (Student réexporté depuis students-types.ts), `app/(staff)/cantine/page.tsx`.

**Administration (W10)**
- `src/components/require-role.tsx` — `RequireRole`, réutilisable pour toute nouvelle page, garde d'hydratation intégrée, affiche `PERMISSION_DENIED` via error-state si rôle non autorisé.
- `src/lib/api/students-types.ts` — `Student` (source de vérité, réexporté par canteen-types.ts), `CreateStudentInput`.
- `src/app/(staff)/administration/students/page.tsx` — liste, création, toggle abonnement, édition photo (URL simulée). Source PARTAGÉE avec `/cantine` (même tableau `students` en mémoire).
- `src/lib/api/admin-types.ts` — `StaffUser`, `AuditLogEntry`.
- `src/app/(staff)/administration/users/page.tsx` — liste comptes staff, changement de rôle, toggle actif/inactif.
- `src/app/(staff)/administration/audit/page.tsx` — journal chronologique, alimenté par `recordAudit()` appelée dans 8 handlers : création produit, ajustement/réception/gaspillage stock, transition commande, distribution repas, création étudiant, bascule abonnement.
- Acteur de l'audit = placeholder générique commenté ("mode dev, pas encore relié à l'auth réelle") — à corriger quand l'auth backend existera.

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (à définir pour W11)
Current milestone: W10 — Administration ✅ TERMINÉ. Prochaine étape : W11 — Snack / Promotions avancé
Completed:
- W0-W9: voir historique
- W10.1: RequireRole (garde par rôle réutilisable) appliqué à catalogue + stock — mergé
- W10.2: gestion étudiants/photo/abonnements, source unique partagée avec Cantine — mergé
- W10.3: users/rôles + audit log branché sur 8 actions du système — mergé
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
- Scan→panier non implémenté : Product n'a pas de champ barcode — W11 pourrait le débloquer
- Imprimante = mock console uniquement — vraie intégration à décider en W13
- Déduction automatique de stock au PREPARING non connectée — TODO explicite
- Acteur de l'audit log = placeholder générique, pas encore relié à l'auth réelle
Next exact action:
- Démarrer W11: options produits, codes-barres (champ barcode sur Product — pourra débloquer le scanner W7), disponibilité, promotions
```

*(Ce bloc doit être mis à jour à chaque étape validée — ne jamais écrire "terminé" sans exécution réelle des validations.)*