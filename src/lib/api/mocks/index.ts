/**
 * Mocks de développement — ne reflètent pas nécessairement les vrais
 * contrats API tant que l'OpenAPI officiel n'est pas confirmé avec le
 * Dev Backend. Codes d'erreur : voir src/lib/error-messages.ts.
 */
import { getErrorMessage } from "@/lib/error-messages";
import type { Role } from "@/lib/roles";
import type { ApiResult } from "../types";
import type { CreateProductInput, Product } from "../catalogue-types";
import { ORDER_TRANSITIONS, type Order, type OrderStatus } from "../orders-types";
import type {
  CartItem,
  CartPriceResult,
  CashSession,
  CashSessionClosure,
  CashSessionSummary,
  CreatedOrder,
  PaymentMethod,
} from "../pos-types";
import type { StockItem, StockMovement } from "../inventory-types";

// État en mémoire du module — se réinitialise au reload, pas de vraie
// persistance tant que le backend n'expose pas /api/v1/orders.
const orders: Order[] = [
  {
    id: "ord_1",
    code: "A-1042",
    status: "DRAFT",
    items: [{ productName: "Coca", quantity: 2, priceCents: 700 }],
    totalCents: 1400,
    createdAt: "2026-08-19T08:05:00.000Z",
    channel: "POS",
  },
  {
    id: "ord_2",
    code: "A-1043",
    status: "AWAITING_PAYMENT",
    items: [
      { productName: "Sandwich Thon", quantity: 1, priceCents: 1500 },
      { productName: "Coca", quantity: 1, priceCents: 700 },
    ],
    totalCents: 2200,
    createdAt: "2026-08-19T08:12:00.000Z",
    channel: "MOBILE",
  },
  {
    id: "ord_3",
    code: "A-1044",
    status: "PAID",
    items: [{ productName: "Tajine Poulet", quantity: 1, priceCents: 3500 }],
    totalCents: 3500,
    createdAt: "2026-08-19T08:20:00.000Z",
    channel: "POS",
  },
  {
    id: "ord_4",
    code: "A-1045",
    status: "QUEUED",
    items: [{ productName: "Coca", quantity: 3, priceCents: 700 }],
    totalCents: 2100,
    createdAt: "2026-08-19T08:28:00.000Z",
    channel: "MOBILE",
  },
  {
    id: "ord_5",
    code: "A-1046",
    status: "PREPARING",
    items: [{ productName: "Sandwich Thon", quantity: 2, priceCents: 1500 }],
    totalCents: 3000,
    createdAt: "2026-08-19T08:33:00.000Z",
    channel: "POS",
  },
  {
    id: "ord_6",
    code: "A-1047",
    status: "READY",
    items: [
      { productName: "Tajine Poulet", quantity: 1, priceCents: 3500 },
      { productName: "Coca", quantity: 1, priceCents: 700 },
    ],
    totalCents: 4200,
    createdAt: "2026-08-19T08:40:00.000Z",
    channel: "MOBILE",
  },
  {
    id: "ord_7",
    code: "A-1048",
    status: "COMPLETED",
    items: [{ productName: "Coca", quantity: 1, priceCents: 700 }],
    totalCents: 700,
    createdAt: "2026-08-19T07:50:00.000Z",
    channel: "POS",
  },
  {
    id: "ord_8",
    code: "A-1049",
    status: "CANCELLED",
    items: [{ productName: "Sandwich Thon", quantity: 1, priceCents: 1500 }],
    totalCents: 1500,
    createdAt: "2026-08-19T07:58:00.000Z",
    channel: "MOBILE",
  },
];

export type MockLoginResponse = {
  token: string;
  user: { name: string; role: Role };
};

function parseJsonBody<T>(options?: RequestInit): T | null {
  if (typeof options?.body !== "string") return null;
  try {
    return JSON.parse(options.body) as T;
  } catch {
    return null;
  }
}

type LoginRequestBody = { identifiant?: unknown; motDePasse?: unknown };

/**
 * Mock du flux de login — ce n'est PAS le vrai flux JWT/refresh du backend
 * (voir CLAUDE_PROJECT.md, "pending: JWT/RBAC réel"). Le token est une
 * chaîne factice et le rôle retourné est toujours ADMINISTRATION par
 * défaut, faute de vraie permissions matrix au login pour l'instant.
 */
function handleLogin(options?: RequestInit): ApiResult<MockLoginResponse> {
  const body = parseJsonBody<LoginRequestBody>(options);
  const identifiant = typeof body?.identifiant === "string" ? body.identifiant : "";
  const motDePasse = typeof body?.motDePasse === "string" ? body.motDePasse : "";

  if (motDePasse === "wrong") {
    return {
      ok: false,
      error: { code: "UNAUTHORIZED", message: getErrorMessage("UNAUTHORIZED"), status: 401 },
    };
  }

  return {
    ok: true,
    data: {
      token: `mock-jwt-${Math.random().toString(36).slice(2, 10)}`,
      user: { name: identifiant || "Utilisateur", role: "ADMINISTRATION" },
    },
  };
}

// État en mémoire du module — se réinitialise au reload, pas de vraie
// persistance tant que le backend n'expose pas /api/v1/products.
let products: Product[] = [
  { id: "prod_1", name: "Coca", priceCents: 700, category: "Boissons", available: true },
  { id: "prod_2", name: "Sandwich Thon", priceCents: 1500, category: "Snacks", available: true },
  { id: "prod_3", name: "Tajine Poulet", priceCents: 3500, category: "Plats", available: true },
];

type CreateProductRequestBody = { name?: unknown; priceCents?: unknown; category?: unknown };

function handleCreateProduct(options?: RequestInit): ApiResult<Product> {
  const body = parseJsonBody<CreateProductRequestBody>(options);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const priceCents = typeof body?.priceCents === "number" ? body.priceCents : NaN;
  const category = typeof body?.category === "string" ? body.category.trim() : "";

  if (!name || !Number.isFinite(priceCents) || priceCents <= 0 || !category) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const input: CreateProductInput = { name, priceCents, category };
  const product: Product = {
    id: `prod_${Math.random().toString(36).slice(2, 10)}`,
    ...input,
    available: true,
  };

  products = [...products, product];

  return { ok: true, data: product };
}

type CartPriceRequestItem = { productId?: unknown; quantity?: unknown };
type CartPriceRequestBody = { items?: unknown };

/**
 * Recalcule toujours le total à partir de `products` — jamais des prix
 * envoyés par le client. Réutilisée par /pos/cart/price ET /pos/orders,
 * pour que la commande finale soit tarifée exactement comme l'aperçu.
 */
function priceCartItems(rawItems: unknown): ApiResult<CartPriceResult> {
  const list: unknown[] = Array.isArray(rawItems) ? rawItems : [];

  const items: CartItem[] = [];
  let totalCents = 0;

  for (const rawItem of list) {
    const candidate = rawItem as CartPriceRequestItem;
    const productId = typeof candidate.productId === "string" ? candidate.productId : null;
    const quantity =
      typeof candidate.quantity === "number" && candidate.quantity > 0 ? candidate.quantity : null;

    if (!productId || !quantity) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
      };
    }

    const product = products.find((candidateProduct) => candidateProduct.id === productId);
    if (!product || !product.available) {
      return {
        ok: false,
        error: { code: "OUT_OF_STOCK", message: getErrorMessage("OUT_OF_STOCK"), status: 409 },
      };
    }

    const subtotalCents = product.priceCents * quantity;
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPriceCents: product.priceCents,
      subtotalCents,
    });
    totalCents += subtotalCents;
  }

  return { ok: true, data: { items, totalCents } };
}

/**
 * Mock illustrant le principe "jamais de prix autoritaire côté client" :
 * le payload attendu ({ productId, quantity }) ne contient volontairement
 * aucun prix. À remplacer par le vrai calcul backend (avec, en plus, les
 * règles de stock/quotas réelles) dès qu'il sera disponible.
 */
function handlePriceCart(options?: RequestInit): ApiResult<CartPriceResult> {
  const body = parseJsonBody<CartPriceRequestBody>(options);
  return priceCartItems(body?.items);
}

// Un StockItem par produit catalogue, quantités/seuils de départ
// arbitraires mais raisonnables pour la démo (Sandwich Thon volontairement
// sous son seuil pour visualiser l'indicateur "stock bas").
const stockSeed: Record<string, { quantityOnHand: number; unit: string; lowStockThreshold: number }> = {
  prod_1: { quantityOnHand: 40, unit: "unité", lowStockThreshold: 10 },
  prod_2: { quantityOnHand: 6, unit: "unité", lowStockThreshold: 10 },
  prod_3: { quantityOnHand: 15, unit: "unité", lowStockThreshold: 5 },
};

const stockItems: StockItem[] = products.map((product) => {
  const seed = stockSeed[product.id] ?? { quantityOnHand: 20, unit: "unité", lowStockThreshold: 5 };
  return {
    id: `stock_${product.id}`,
    productId: product.id,
    productName: product.name,
    ...seed,
  };
});

let stockMovements: StockMovement[] = [];

type StockAdjustRequestBody = { quantityDelta?: unknown; reason?: unknown };

/**
 * VALIDATION_ERROR (pas OUT_OF_STOCK) si l'ajustement ferait passer la
 * quantité sous 0 — voir l'explication en tête de section : c'est une
 * donnée saisie incohérente avec l'état actuel, pas un signal de vente.
 */
function handleAdjustStock(stockItemId: string, options?: RequestInit): ApiResult<StockItem> {
  const item = stockItems.find((candidate) => candidate.id === stockItemId);
  if (!item) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<StockAdjustRequestBody>(options);
  const quantityDelta =
    typeof body?.quantityDelta === "number" && Number.isFinite(body.quantityDelta) ? body.quantityDelta : null;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (quantityDelta === null || quantityDelta === 0 || !reason) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const nextQuantity = item.quantityOnHand + quantityDelta;
  if (nextQuantity < 0) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  item.quantityOnHand = nextQuantity;

  const movement: StockMovement = {
    id: `mov_${Math.random().toString(36).slice(2, 10)}`,
    stockItemId: item.id,
    type: "ADJUSTMENT",
    quantityDelta,
    reason,
    createdAt: new Date().toISOString(),
    // Pas d'identité utilisateur propagée jusqu'au mock pour l'instant
    // (apiFetch n'attache aucun token aux requêtes) — à corriger quand
    // l'auth réelle circulera jusqu'ici.
    createdBy: "Staff (mode dev)",
  };
  stockMovements = [movement, ...stockMovements];

  return { ok: true, data: item };
}

function handleGetStockMovements(stockItemId: string): ApiResult<StockMovement[]> {
  const exists = stockItems.some((item) => item.id === stockItemId);
  if (!exists) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const movements = stockMovements
    .filter((movement) => movement.stockItemId === stockItemId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { ok: true, data: movements };
}

const STOCK_ADJUST_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/adjust$/;
const STOCK_MOVEMENTS_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/movements$/;

function handleGetOrder(id: string): ApiResult<Order> {
  const order = orders.find((candidate) => candidate.id === id);
  if (!order) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }
  return { ok: true, data: order };
}

type TransitionRequestBody = { targetStatus?: unknown };

// TODO (étape future, hors scope W8) : quand une commande passe à
// PREPARING, déduire le stock des ingrédients consommés (StockMovement de
// type SALE_DEDUCTION). Nécessite un lien recette/ingrédients par produit
// qui n'existe pas encore dans le catalogue — non implémenté ici.
function handleOrderTransition(id: string, options?: RequestInit): ApiResult<Order> {
  const order = orders.find((candidate) => candidate.id === id);
  if (!order) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<TransitionRequestBody>(options);
  const targetStatus = typeof body?.targetStatus === "string" ? (body.targetStatus as OrderStatus) : null;

  if (!targetStatus || !ORDER_TRANSITIONS[order.status].includes(targetStatus)) {
    return {
      ok: false,
      error: { code: "INVALID_ORDER_STATUS", message: getErrorMessage("INVALID_ORDER_STATUS"), status: 409 },
    };
  }

  order.status = targetStatus;

  return { ok: true, data: order };
}

// État en mémoire du module — une seule session à la fois, se réinitialise
// au reload. Pas de vraie clôture avec écarts ici (prévue en W7).
let currentSession: CashSession | null = null;
// Ventes de la session courante, par mode de paiement — remises à zéro à
// chaque ouverture. Servent à calculer le montant attendu en caisse.
let sessionCashSalesCents = 0;
let sessionCardSalesCents = 0;

type SessionOpenRequestBody = { openingCashCents?: unknown };

function handleOpenSession(options?: RequestInit): ApiResult<CashSession> {
  if (currentSession && currentSession.status === "OPEN") {
    return {
      ok: false,
      error: { code: "SESSION_ALREADY_OPEN", message: getErrorMessage("SESSION_ALREADY_OPEN"), status: 409 },
    };
  }

  const body = parseJsonBody<SessionOpenRequestBody>(options);
  const openingCashCents =
    typeof body?.openingCashCents === "number" &&
    Number.isFinite(body.openingCashCents) &&
    body.openingCashCents >= 0
      ? body.openingCashCents
      : null;

  if (openingCashCents === null) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  currentSession = {
    id: `sess_${Math.random().toString(36).slice(2, 10)}`,
    openedAt: new Date().toISOString(),
    openingCashCents,
    status: "OPEN",
  };
  sessionCashSalesCents = 0;
  sessionCardSalesCents = 0;

  return { ok: true, data: currentSession };
}

function nextOrderCode(): string {
  const numbers = orders
    .map((order) => Number.parseInt(order.code.replace(/^\D+/, ""), 10))
    .filter((value) => Number.isFinite(value));
  const max = numbers.length > 0 ? Math.max(...numbers) : 1041;
  return `A-${max + 1}`;
}

type PosOrderRequestBody = { items?: unknown; paymentMethod?: unknown };

/**
 * Simplification MVP : un paiement CASH/TPE encaissé passe directement en
 * "PAID", sans étape AWAITING_PAYMENT intermédiaire (pas de flux de
 * paiement asynchrone/à distance dans ce mock). À revoir avec le vrai flux
 * backend, où AWAITING_PAYMENT sert probablement pour TPE réel/QR mobile.
 */
function handleCreatePosOrder(options?: RequestInit): ApiResult<CreatedOrder> {
  if (!currentSession || currentSession.status !== "OPEN") {
    return {
      ok: false,
      error: { code: "POS_SESSION_NOT_OPEN", message: getErrorMessage("POS_SESSION_NOT_OPEN"), status: 409 },
    };
  }

  const body = parseJsonBody<PosOrderRequestBody>(options);
  const paymentMethod: PaymentMethod | null =
    body?.paymentMethod === "CASH" || body?.paymentMethod === "CARD" ? body.paymentMethod : null;

  if (!paymentMethod) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const priced = priceCartItems(body?.items);
  if (!priced.ok) return priced;

  const paidAt = new Date().toISOString();
  const newOrder: Order = {
    id: `ord_${Math.random().toString(36).slice(2, 10)}`,
    code: nextOrderCode(),
    status: "PAID",
    items: priced.data.items.map(({ productName, quantity, unitPriceCents }) => ({
      productName,
      quantity,
      priceCents: unitPriceCents,
    })),
    totalCents: priced.data.totalCents,
    createdAt: paidAt,
    channel: "POS",
  };

  orders.push(newOrder);

  if (paymentMethod === "CASH") {
    sessionCashSalesCents += newOrder.totalCents;
  } else {
    sessionCardSalesCents += newOrder.totalCents;
  }

  return {
    ok: true,
    data: {
      id: newOrder.id,
      code: newOrder.code,
      items: priced.data.items,
      totalCents: newOrder.totalCents,
      paymentMethod,
      paidAt,
    },
  };
}

function handleSessionSummary(): ApiResult<CashSessionSummary> {
  if (!currentSession || currentSession.status !== "OPEN") {
    return {
      ok: false,
      error: { code: "POS_SESSION_NOT_OPEN", message: getErrorMessage("POS_SESSION_NOT_OPEN"), status: 409 },
    };
  }

  return {
    ok: true,
    data: {
      sessionId: currentSession.id,
      openingCashCents: currentSession.openingCashCents,
      cashSalesCents: sessionCashSalesCents,
      cardSalesCents: sessionCardSalesCents,
      expectedCashCents: currentSession.openingCashCents + sessionCashSalesCents,
    },
  };
}

type SessionCloseRequestBody = { declaredCashCents?: unknown; reasonCode?: unknown };

function handleCloseSession(options?: RequestInit): ApiResult<CashSessionClosure> {
  if (!currentSession || currentSession.status !== "OPEN") {
    return {
      ok: false,
      error: { code: "POS_SESSION_NOT_OPEN", message: getErrorMessage("POS_SESSION_NOT_OPEN"), status: 409 },
    };
  }

  const body = parseJsonBody<SessionCloseRequestBody>(options);
  const declaredCashCents =
    typeof body?.declaredCashCents === "number" &&
    Number.isFinite(body.declaredCashCents) &&
    body.declaredCashCents >= 0
      ? body.declaredCashCents
      : null;
  const reasonCode =
    typeof body?.reasonCode === "string" && body.reasonCode.trim() ? body.reasonCode.trim() : undefined;

  if (declaredCashCents === null) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const expectedCashCents = currentSession.openingCashCents + sessionCashSalesCents;
  const differenceCents = declaredCashCents - expectedCashCents;

  if (differenceCents !== 0 && !reasonCode) {
    return {
      ok: false,
      error: {
        code: "CASH_DIFFERENCE_REASON_REQUIRED",
        message: getErrorMessage("CASH_DIFFERENCE_REASON_REQUIRED"),
        status: 422,
      },
    };
  }

  const closure: CashSessionClosure = {
    sessionId: currentSession.id,
    declaredCashCents,
    expectedCashCents,
    differenceCents,
    reasonCode,
    closedAt: new Date().toISOString(),
  };

  currentSession = null;
  sessionCashSalesCents = 0;
  sessionCardSalesCents = 0;

  return { ok: true, data: closure };
}

const ORDER_DETAIL_PATTERN = /^\/api\/v1\/orders\/([^/]+)$/;
const ORDER_TRANSITION_PATTERN = /^\/api\/v1\/orders\/([^/]+)\/transition$/;

type MockHandler = (options?: RequestInit) => ApiResult<unknown>;

/** Clé = "MÉTHODE chemin". Pas de vraie route Next — juste un registre en mémoire. */
const mockHandlers: Record<string, MockHandler> = {
  "GET /api/v1/health": () => ({ ok: true, data: { status: "ok" } }),

  "GET /api/v1/orders": () => ({ ok: true, data: orders }),

  // Endpoint de démonstration uniquement, pour tester le flux error-state.
  "GET /api/v1/demo/out-of-stock": () => ({
    ok: false,
    error: {
      code: "OUT_OF_STOCK",
      message: getErrorMessage("OUT_OF_STOCK"),
      status: 409,
    },
  }),

  "POST /api/v1/auth/login": handleLogin,

  "GET /api/v1/products": () => ({ ok: true, data: products }),
  "POST /api/v1/products": handleCreateProduct,

  "POST /api/v1/pos/cart/price": handlePriceCart,

  "GET /api/v1/pos/session/current": () => ({ ok: true, data: currentSession }),
  "POST /api/v1/pos/session/open": handleOpenSession,
  "POST /api/v1/pos/orders": handleCreatePosOrder,

  "GET /api/v1/pos/session/summary": handleSessionSummary,
  "POST /api/v1/pos/session/close": handleCloseSession,

  "GET /api/v1/inventory/items": () => ({ ok: true, data: stockItems }),
};

export function resolveMock<T>(path: string, options?: RequestInit): ApiResult<T> {
  const method = (options?.method ?? "GET").toUpperCase();

  if (method === "GET") {
    const orderMatch = path.match(ORDER_DETAIL_PATTERN);
    if (orderMatch) return handleGetOrder(orderMatch[1]) as ApiResult<T>;

    const movementsMatch = path.match(STOCK_MOVEMENTS_PATTERN);
    if (movementsMatch) return handleGetStockMovements(movementsMatch[1]) as ApiResult<T>;
  }
  if (method === "POST") {
    const transitionMatch = path.match(ORDER_TRANSITION_PATTERN);
    if (transitionMatch) return handleOrderTransition(transitionMatch[1], options) as ApiResult<T>;

    const adjustMatch = path.match(STOCK_ADJUST_PATTERN);
    if (adjustMatch) return handleAdjustStock(adjustMatch[1], options) as ApiResult<T>;
  }

  const handler = mockHandlers[`${method} ${path}`];

  if (!handler) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: getErrorMessage("INTERNAL_ERROR"),
        status: 404,
      },
    };
  }

  return handler(options) as ApiResult<T>;
}
