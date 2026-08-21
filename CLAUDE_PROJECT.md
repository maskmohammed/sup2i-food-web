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
- Ne jamais accepter comme vérité un total/prix/stock calculé côté client — le serveur revalide toujours, promotions incluses.
- Ne jamais implémenter une transition d'état absente de la state machine des commandes.
- Décider le comportement UI avec `error.code`, jamais avec le texte `message`.
- Bloquer le double clic/double soumission sur toute action critique.
- Après une action critique réussie, toujours rafraîchir l'état depuis le serveur.
- KDS n'affiche jamais une commande non payée.
- Ne jamais inventer un endpoint sans le marquer explicitement comme mock/proposition.
- Ne jamais accéder à une éventuelle DB Cactus/PHP directement, ni supposer son schéma.
- Ne jamais affirmer qu'une étape est "DONE" sans avoir réellement exécuté lint/typecheck/tests/build ET testé en conditions réelles.
- Prix stockés en centimes, jamais en float.
- Le total d'un panier/commande vient toujours d'un round-trip serveur.
- Une impression échouée n'est jamais traitée comme un paiement échoué.
- Ne jamais inventer un mapping/champ sans donnée réelle disponible — dire explicitement "non calculable" plutôt que fabriquer une valeur (règle confirmée en W12 sur les KPI).
- Ne jamais utiliser "profit"/"bénéfice net" nulle part dans le code ou l'UI — toute valorisation de stock/gaspillage doit être explicitement labellisée "estimation".
- Dans toute rangée avec du texte tronqué : vérifier que TOUTES les colonnes fixes combinées ne dépassent jamais la largeur disponible avant de blâmer la colonne flexible — un badge/bouton supplémentaire conditionnel peut faire déborder une grille qui semblait correcte (bug réel rencontré en W12 : la cause était un manque d'espace total, pas la classe flex-1 elle-même). Préférer un layout multi-lignes (wrap) dès qu'une ligne combine nom + plusieurs badges/actions.
- Toute règle métier bloquante doit être vérifiée UI ET serveur.
- La photo étudiante n'est jamais modifiable depuis Cantine.
- Toute page Administration/Stock/Catalogue/Direction sensible doit être enveloppée par `RequireRole`.
- Les mocks sont en mémoire uniquement — un F5/nouvel onglet réinitialise l'état, c'est attendu, pas un bug.

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
2. Vérification visuelle EN CONDITIONS RÉELLES (clics effectifs, pas lecture de code seule), deux thèmes, F5.
3. Lint/build OK.
4. Commit → push → merge vers `develop`.
5. Mise à jour `CURRENT_STATUS`.
6. Étape suivante seulement après validation explicite.

Étapes larges découpées en sous-étapes.

**Méthode de debug (rodée en W12)** : quand un bug visuel persiste malgré du code source vérifié correct — (1) purger `.next` et redémarrer `npm run dev`, (2) ajouter un `console.log` temporaire pour confirmer que la donnée est correcte au runtime, (3) si la donnée est bonne, inspecter le DOM réel via DevTools (onglet Computed/Styles) plutôt que de continuer à deviner dans le code — ça révèle la vraie cause (ex. une grille qui manque d'espace total) bien plus vite que d'itérer sur des hypothèses.

---

## 4. Roadmap W0 → W14

- **W0 à W12** ✅ TOUS TERMINÉS.
  - W0 Audit repo, W1 Shell/Design/RBAC, W2 API/Auth/Erreurs, W3 Catalogue, W4 Orders, W5 POS MVP, W6 KDS, W7 Rush/Clôture/Matériel, W8 Inventory/Waste, W9 Cantine/Food Pass, W10 Administration, W11 Snack/Promotions (scanner branché, TODO W7 fermé), W12 Direction/Finance (KPI honnêtes, aucun "profit").
- **W13 — Cactus / Matériel — audit d'intégration** *(prochaine étape, dépend de facteurs externes)* : dès que code Cactus et matériel réel (scanner, imprimante, TPE) sont disponibles.
- **W14 — Hardening / Pilote** : E2E, sécurité, perf, a11y, résilience réseau, staging, pilote.

**W13 et W14 ne dépendent plus uniquement du rythme de développement** — W13 nécessite un accès au code Cactus/PHP existant et au matériel physique (scanner réel, imprimante réelle, TPE), que Hamza n'a pas encore. En attendant, il est possible de :
- Continuer à durcir/tester ce qui existe déjà (W14 anticipé partiellement : tests E2E, a11y, résilience réseau sur les mocks).
- Attendre que le Dev Backend avance sur les 43 endpoints OpenAPI cibles pour commencer à remplacer les mocks par de vrais appels (`NEXT_PUBLIC_API_MODE=live`).

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

**API / Auth (W2)** — `client.ts`, `mocks/index.ts`, `error-messages.ts`, `auth-context.tsx` (100% mock).

**Catalogue (W3, enrichi W11)** — `catalogue-types.ts` (barcode, options, Promotion), `administration/catalogue/page.tsx`, `administration/promotions/page.tsx`.

**Orders (W4)** — `orders-types.ts`, `orders/page.tsx`, `orders/[id]/page.tsx`.

**POS (W5-W7, enrichi W11)** — `pos-types.ts`, `pos/page.tsx` (session, panier, paiement, Rush, clôture, impression, **scanner branché**), `close-session-panel.tsx`, `hardware/scanner.ts`, `printer.ts`.

**KDS (W6)** — `use-order-transition.ts`, `kds/page.tsx`.

**Inventaire (W8, layout corrigé W12)** — `inventory-types.ts`, `stock/page.tsx` (layout deux-lignes pour éviter tout débordement nom+badges+boutons), `dashboard/stock-alerts-card.tsx`.

**Cantine (W9)** — `canteen-types.ts`, `cantine/page.tsx`.

**Administration (W10)** — `students-types.ts`, `administration/students/page.tsx`, `admin-types.ts`, `administration/users/page.tsx`, `administration/audit/page.tsx` (8 actions tracées).

**Direction (W12)**
- `src/lib/api/direction-types.ts` — `DirectionKpi`.
- `src/app/(staff)/direction/page.tsx` — CA, panier moyen, commandes par canal, repas cantine du jour, alertes stock, gaspillage (compte + valeur "estimation", jamais "bénéfice"). Gardée par `RequireRole` (DIRECTION, FINANCE, SYSTEM_ADMIN).
- `ordersByPaymentMethod` : non calculable (le mode de paiement n'est pas persisté sur `Order`) — carte omise plutôt qu'inventée, documenté dans le code.

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (aucune — W0 à W12 tous mergés, W13 en attente de matériel/accès Cactus)
Current milestone: W12 — Direction / Finance ✅ TERMINÉ. W0 à W12 COMPLETS.
Completed:
- W0-W11: voir historique
- W12: dashboard KPI Direction/Finance, agrégation honnête, gaspillage jamais présenté comme profit — mergé sur develop
- Bug résolu en cours de route: débordement de grille sur /stock (nom+badge+boutons), corrigé en layout deux-lignes
Validated:
- lint: OK
- build: OK
Backend dependencies:
- ready: PostgreSQL/Flyway opérationnels
- pending: JWT/RBAC réel, endpoints métier (43 paths cibles, pas tous implémentés), accès code Cactus/PHP, matériel réel (scanner/imprimante/TPE)
Open decisions:
- W13 (Cactus/matériel) est BLOQUÉE en attente d'accès externe — pas un choix de priorisation
- Auth actuelle 100% mock
- ORDER_TRANSITIONS / ORDER_TRANSITION_ROLES sont des propositions frontend
- Commande POS créée directement en PAID (pas d'AWAITING_PAYMENT)
- KDS en polling (6s)
- Déduction automatique de stock au PREPARING non connectée (vente POS n'affecte pas /stock)
- ordersByPaymentMethod non calculable (paymentMethod non persisté sur Order)
- Acteur de l'audit log = placeholder générique
Next exact action:
- Si accès Cactus/matériel disponible : démarrer W13 (audit d'intégration)
- Sinon : anticiper W14 sur ce qui ne dépend pas du matériel — tests E2E des flux mock existants, accessibilité (a11y), résilience réseau (comportement de l'app si les endpoints mock échouent), ou attendre l'avancement du Dev Backend pour commencer à basculer NEXT_PUBLIC_API_MODE vers "live" module par module
```

*(Ce bloc doit être mis à jour à chaque étape validée.)*