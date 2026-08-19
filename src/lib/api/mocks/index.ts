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
import type { CartItem, CartPriceResult } from "../pos-types";

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
 * Mock illustrant le principe "jamais de prix autoritaire côté client" :
 * le payload attendu ({ productId, quantity }) ne contient volontairement
 * aucun prix — le total est toujours recalculé ici à partir de `products`.
 * À remplacer par le vrai calcul backend (avec, en plus, les règles de
 * stock/quotas réelles) dès qu'il sera disponible.
 */
function handlePriceCart(options?: RequestInit): ApiResult<CartPriceResult> {
  const body = parseJsonBody<CartPriceRequestBody>(options);
  const rawItems: unknown[] = Array.isArray(body?.items) ? body.items : [];

  const items: CartItem[] = [];
  let totalCents = 0;

  for (const rawItem of rawItems) {
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
};

export function resolveMock<T>(path: string, options?: RequestInit): ApiResult<T> {
  const method = (options?.method ?? "GET").toUpperCase();

  if (method === "GET") {
    const match = path.match(ORDER_DETAIL_PATTERN);
    if (match) return handleGetOrder(match[1]) as ApiResult<T>;
  }
  if (method === "POST") {
    const match = path.match(ORDER_TRANSITION_PATTERN);
    if (match) return handleOrderTransition(match[1], options) as ApiResult<T>;
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
