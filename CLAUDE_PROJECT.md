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

---

## 4. Roadmap W0 → W14

- **W0 à W12** ✅ TOUS TERMINÉS.
- **Portions de W14 anticipées** ✅ :
  - Résilience réseau : simulation de panne (toggle dev), timeout réel 8s, clé d'idempotence sur le paiement POS.
  - Accessibilité : `aria-label` sur champs Cantine/Users, `role="alert"`/`aria-live` sur error-state/loading-state, `focus-visible` global cohérent, `<h2>` pour les sous-sections manquantes (stock/catalogue/promotions/students). Contrastes de 3 couleurs de statut (`alert`, `ready`, `accent-warm`) sous le seuil WCAG AA texte normal — **non corrigés, limite connue à trancher avec l'équipe/design**.
- **W13 — Cactus / Matériel — audit d'intégration** — **BLOQUÉE, en attente d'accès externe** au code Cactus (PHP, école) et au matériel physique (scanner, imprimante, TPE).
- **W14 — reste à faire** : tests E2E des flux mock, correction éventuelle des contrastes (décision à prendre), staging, pilote.

Options pour la suite tant que W13 reste bloquée :
- Tests E2E des flux mock existants.
- Décider avec l'équipe si les 3 contrastes signalés doivent être corrigés (ajusterait la palette v3).
- Attendre l'avancement du Dev Backend sur les 43 endpoints OpenAPI pour basculer `NEXT_PUBLIC_API_MODE` vers `"live"` module par module.
- Point d'équipe sur l'accès Cactus/matériel.

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

**⚠️ Contraste WCAG connu** : `text-status-alert`, `text-status-ready`, `text-accent-warm` utilisés comme texte de badge échouent le seuil AA (4.5:1) dans au moins un thème — acceptable pour composants UI/grand texte (seuil 3:1 respecté), pas pour texte normal. `text-text-muted` reste conforme.

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

---

## 8. CURRENT_STATUS

```text
Project: SUP2I FOOD
Repo: sup2i-food-web (GitHub: maskmohammed/sup2i-food-web, privé)
Base branch: develop
Working branch: (aucune — dernière branche mergée: feature/web-a11y)
Current milestone: W0-W12 complets + résilience réseau + accessibilité (portions W14 anticipées). W13 BLOQUÉE (accès Cactus/matériel manquant).
Completed:
- W0-W12: voir historique
- Résilience réseau (W14 anticipé): simulation de panne, timeout 8s, idempotence POS — mergé
- Accessibilité (W14 anticipé): focus-visible global, aria-labels, live regions, h2 manquants — mergé
Validated:
- lint: OK
- build: OK
Backend dependencies:
- ready: PostgreSQL/Flyway opérationnels
- pending: JWT/RBAC réel, 43 endpoints OpenAPI (partiels), accès code Cactus, matériel réel
Open decisions:
- W13 BLOQUÉE — dépend de l'accès externe, pas du rythme de dev
- 3 contrastes de couleur (alert/ready/accent-warm comme texte) sous seuil WCAG AA — décision à prendre : corriger la palette ou accepter la limite
- Idempotence POS: nom de champ à confirmer avec Dev Backend (body vs header Idempotency-Key)
- Scénario "serveur a réussi mais réponse perdue" non testable avec mocks actuels
- Auth 100% mock; ORDER_TRANSITIONS propositions frontend; POS crée en PAID direct; KDS en polling; déduction stock au PREPARING non connectée; ordersByPaymentMethod non calculable; acteur audit = placeholder
Next exact action:
- Si accès Cactus/matériel obtenu: démarrer W13
- Sinon: tests E2E des flux mock, ou décision d'équipe sur les contrastes, ou attendre avancement Dev Backend pour NEXT_PUBLIC_API_MODE="live"
```

*(Ce bloc doit être mis à jour à chaque étape validée.)*