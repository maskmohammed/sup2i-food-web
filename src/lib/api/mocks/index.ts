/**
 * Mocks de développement — ne reflètent pas nécessairement les vrais
 * contrats API tant que l'OpenAPI officiel n'est pas confirmé avec le
 * Dev Backend. Codes d'erreur : voir src/lib/error-messages.ts.
 */
import { getErrorMessage } from "@/lib/error-messages";
import { ROLES, type Role } from "@/lib/roles";
import type { ApiResult } from "../types";
import type { CreateProductInput, Product, ProductOption, Promotion } from "../catalogue-types";
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
import type { StockItem, StockMovement, WasteReason } from "../inventory-types";
import { MEAL_TYPE_LABELS } from "../canteen-types";
import type { FoodPassLookupResult, MealType, MealUsage } from "../canteen-types";
import type { CreateStudentInput, Student } from "../students-types";
import type { AuditLogEntry, StaffUser } from "../admin-types";
import type { DirectionKpi } from "../direction-types";

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

// Journal d'audit centralisé — alimenté par les handlers de mutation
// existants ci-dessous (voir chaque appel recordAudit), pas un système
// parallèle déconnecté.
let auditLog: AuditLogEntry[] = [];

type AuditActor = { actorName: string; actorRole: Role };

// Acteur non identifié — auth réelle mock, à relier au vrai utilisateur
// connecté quand l'auth backend existera (apiFetch n'attache aucun token
// aux requêtes mock pour l'instant, voir handleAdjustStock plus bas pour
// la même limite déjà documentée côté mouvements de stock).
const UNKNOWN_ACTOR: AuditActor = { actorName: "Staff (mode dev)", actorRole: "SYSTEM_ADMIN" };

function recordAudit(action: string, details: string, actor: AuditActor = UNKNOWN_ACTOR): void {
  const entry: AuditLogEntry = {
    id: `audit_${Math.random().toString(36).slice(2, 10)}`,
    actorName: actor.actorName,
    actorRole: actor.actorRole,
    action,
    details,
    timestamp: new Date().toISOString(),
  };
  auditLog = [entry, ...auditLog];
}

// État en mémoire du module — se réinitialise au reload, pas de vraie
// persistance tant que le backend n'expose pas /api/v1/products.
let products: Product[] = [
  {
    id: "prod_1",
    name: "Coca",
    priceCents: 700,
    category: "Boissons",
    available: true,
    barcode: "6111000000017",
  },
  {
    id: "prod_2",
    name: "Sandwich Thon",
    priceCents: 1500,
    category: "Snacks",
    available: true,
    barcode: "6111000000024",
    options: [
      { id: "opt_1", name: "Sans sauce", priceDeltaCents: 0 },
      { id: "opt_2", name: "Pain complet", priceDeltaCents: 100 },
    ],
  },
  {
    id: "prod_3",
    name: "Tajine Poulet",
    priceCents: 3500,
    category: "Plats",
    available: true,
    barcode: "6111000000031",
    options: [{ id: "opt_3", name: "Portion double", priceDeltaCents: 1500 }],
  },
];

type CreateProductRequestBody = {
  name?: unknown;
  priceCents?: unknown;
  category?: unknown;
  barcode?: unknown;
};

function handleCreateProduct(options?: RequestInit): ApiResult<Product> {
  const body = parseJsonBody<CreateProductRequestBody>(options);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const priceCents = typeof body?.priceCents === "number" ? body.priceCents : NaN;
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const barcode = typeof body?.barcode === "string" ? body.barcode.trim() : "";

  if (!name || !Number.isFinite(priceCents) || priceCents <= 0 || !category) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const barcodeTaken = barcode ? products.some((candidate) => candidate.barcode === barcode) : false;
  if (barcodeTaken) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const input: CreateProductInput = { name, priceCents, category, barcode: barcode || undefined };
  const product: Product = {
    id: `prod_${Math.random().toString(36).slice(2, 10)}`,
    ...input,
    available: true,
  };

  products = [...products, product];

  recordAudit("PRODUCT_CREATED", `${product.name} créé à ${(product.priceCents / 100).toFixed(2)} DH`);

  return { ok: true, data: product };
}

type UpdateAvailabilityRequestBody = { available?: unknown };

function handleUpdateProductAvailability(productId: string, options?: RequestInit): ApiResult<Product> {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdateAvailabilityRequestBody>(options);
  if (typeof body?.available !== "boolean") {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  product.available = body.available;

  return { ok: true, data: product };
}

type UpdateProductRequestBody = { barcode?: unknown; options?: unknown };

function isProductOptionArray(value: unknown): value is ProductOption[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const candidate = item as { id?: unknown; name?: unknown; priceDeltaCents?: unknown };
    return (
      typeof candidate.id === "string" &&
      typeof candidate.name === "string" &&
      typeof candidate.priceDeltaCents === "number"
    );
  });
}

/** Édition partielle — barcode et/ou options, chaque champ est optionnel. */
function handleUpdateProduct(productId: string, options?: RequestInit): ApiResult<Product> {
  const product = products.find((candidate) => candidate.id === productId);
  if (!product) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdateProductRequestBody>(options);

  if (typeof body?.barcode === "string") {
    const trimmed = body.barcode.trim();
    const barcodeTaken = trimmed
      ? products.some((candidate) => candidate.id !== productId && candidate.barcode === trimmed)
      : false;

    if (barcodeTaken) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
      };
    }

    product.barcode = trimmed || undefined;
  }

  if (body?.options !== undefined) {
    if (!isProductOptionArray(body.options)) {
      return {
        ok: false,
        error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
      };
    }
    product.options = body.options;
  }

  return { ok: true, data: product };
}

// État promotions en mémoire — appliquées automatiquement au calcul du
// total dans priceCartItems ci-dessous, jamais côté client.
let promotions: Promotion[] = [
  {
    id: "promo_1",
    label: "-10% sur les boissons",
    discountPercent: 10,
    active: true,
    appliesToProductIds: ["prod_1"],
  },
];

function activeDiscountPercentFor(productId: string): number {
  const applicable = promotions.filter(
    (promotion) => promotion.active && promotion.appliesToProductIds.includes(productId),
  );
  if (applicable.length === 0) return 0;
  return Math.max(...applicable.map((promotion) => promotion.discountPercent));
}

function handleGetPromotions(): ApiResult<Promotion[]> {
  return { ok: true, data: promotions };
}

type CreatePromotionRequestBody = {
  label?: unknown;
  discountPercent?: unknown;
  appliesToProductIds?: unknown;
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function handleCreatePromotion(options?: RequestInit): ApiResult<Promotion> {
  const body = parseJsonBody<CreatePromotionRequestBody>(options);
  const label = typeof body?.label === "string" ? body.label.trim() : "";
  const discountPercent = typeof body?.discountPercent === "number" ? body.discountPercent : NaN;
  const appliesToProductIds = isStringArray(body?.appliesToProductIds) ? body.appliesToProductIds : [];

  if (
    !label ||
    !Number.isFinite(discountPercent) ||
    discountPercent <= 0 ||
    discountPercent > 100 ||
    appliesToProductIds.length === 0
  ) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const promotion: Promotion = {
    id: `promo_${Math.random().toString(36).slice(2, 10)}`,
    label,
    discountPercent,
    active: true,
    appliesToProductIds,
  };

  promotions = [...promotions, promotion];

  return { ok: true, data: promotion };
}

type UpdatePromotionActiveRequestBody = { active?: unknown };

function handleUpdatePromotionActive(promotionId: string, options?: RequestInit): ApiResult<Promotion> {
  const promotion = promotions.find((candidate) => candidate.id === promotionId);
  if (!promotion) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdatePromotionActiveRequestBody>(options);
  if (typeof body?.active !== "boolean") {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  promotion.active = body.active;

  return { ok: true, data: promotion };
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

    const discountPercent = activeDiscountPercentFor(product.id);
    const unitPriceCents =
      discountPercent > 0 ? Math.round(product.priceCents * (1 - discountPercent / 100)) : product.priceCents;
    const subtotalCents = unitPriceCents * quantity;
    items.push({
      productId: product.id,
      productName: product.name,
      quantity,
      unitPriceCents,
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

  recordAudit(
    "STOCK_ADJUSTED",
    `${item.productName} : ${quantityDelta > 0 ? "+" : ""}${quantityDelta} ${item.unit} (${reason})`,
  );

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

const WASTE_REASONS: WasteReason[] = ["EXPIRED", "DAMAGED", "PREPARATION_ERROR", "OTHER"];

function isWasteReason(value: unknown): value is WasteReason {
  return typeof value === "string" && (WASTE_REASONS as string[]).includes(value);
}

type StockWasteRequestBody = { quantity?: unknown; wasteReason?: unknown; note?: unknown };

/** Même contrainte que l'ajustement : jamais de résultat sous 0. */
function handleWasteStock(stockItemId: string, options?: RequestInit): ApiResult<StockItem> {
  const item = stockItems.find((candidate) => candidate.id === stockItemId);
  if (!item) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<StockWasteRequestBody>(options);
  const quantity =
    typeof body?.quantity === "number" && Number.isFinite(body.quantity) && body.quantity > 0
      ? body.quantity
      : null;
  const wasteReason = isWasteReason(body?.wasteReason) ? body.wasteReason : null;
  const note = typeof body?.note === "string" && body.note.trim() ? body.note.trim() : undefined;

  if (quantity === null || !wasteReason) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const quantityDelta = -quantity;
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
    type: "WASTE",
    quantityDelta,
    reason: note ? `${wasteReason} — ${note}` : wasteReason,
    createdAt: new Date().toISOString(),
    createdBy: "Staff (mode dev)",
  };
  stockMovements = [movement, ...stockMovements];

  recordAudit("STOCK_WASTED", `${item.productName} : ${quantityDelta} ${item.unit} (${wasteReason})`);

  return { ok: true, data: item };
}

type StockReceiveRequestBody = { quantity?: unknown };

/** Pas de motif requis — une réception n'est pas une correction manuelle. */
function handleReceiveStock(stockItemId: string, options?: RequestInit): ApiResult<StockItem> {
  const item = stockItems.find((candidate) => candidate.id === stockItemId);
  if (!item) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<StockReceiveRequestBody>(options);
  const quantity =
    typeof body?.quantity === "number" && Number.isFinite(body.quantity) && body.quantity > 0
      ? body.quantity
      : null;

  if (quantity === null) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  item.quantityOnHand += quantity;

  const movement: StockMovement = {
    id: `mov_${Math.random().toString(36).slice(2, 10)}`,
    stockItemId: item.id,
    type: "RECEIPT",
    quantityDelta: quantity,
    createdAt: new Date().toISOString(),
    createdBy: "Staff (mode dev)",
  };
  stockMovements = [movement, ...stockMovements];

  recordAudit("STOCK_RECEIVED", `${item.productName} : +${quantity} ${item.unit}`);

  return { ok: true, data: item };
}

function handleGetStockAlerts(): ApiResult<StockItem[]> {
  const alerts = stockItems.filter((item) => item.quantityOnHand <= item.lowStockThreshold);
  return { ok: true, data: alerts };
}

const STOCK_ADJUST_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/adjust$/;
const STOCK_MOVEMENTS_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/movements$/;
const STOCK_WASTE_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/waste$/;
const STOCK_RECEIVE_PATTERN = /^\/api\/v1\/inventory\/items\/([^/]+)\/receive$/;

// État étudiants centralisé — source unique pour Administration (W10) ET
// Cantine (W9). Abonnement inactif pour std_5 volontairement, pour
// visualiser ce cas en démo.
let students: Student[] = [
  {
    id: "std_1",
    fullName: "Yassine El Amrani",
    photoUrl: "",
    foodPassCode: "FP-1001",
    subscriptionActive: true,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "std_2",
    fullName: "Salma Bensaid",
    photoUrl: "",
    foodPassCode: "FP-1002",
    subscriptionActive: true,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "std_3",
    fullName: "Omar Idrissi",
    photoUrl: "",
    foodPassCode: "FP-1003",
    subscriptionActive: true,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "std_4",
    fullName: "Nour Chafik",
    photoUrl: "",
    foodPassCode: "FP-1004",
    subscriptionActive: true,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: "std_5",
    fullName: "Karim Ziani",
    photoUrl: "",
    foodPassCode: "FP-1005",
    subscriptionActive: false,
    createdAt: "2026-08-01T08:00:00.000Z",
  },
];

type CreateStudentRequestBody = { fullName?: unknown; foodPassCode?: unknown };

function handleGetStudents(): ApiResult<Student[]> {
  return { ok: true, data: students };
}

function handleCreateStudent(options?: RequestInit): ApiResult<Student> {
  const body = parseJsonBody<CreateStudentRequestBody>(options);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const foodPassCode = typeof body?.foodPassCode === "string" ? body.foodPassCode.trim() : "";

  const codeAlreadyUsed = students.some((candidate) => candidate.foodPassCode === foodPassCode);

  if (!fullName || !foodPassCode || codeAlreadyUsed) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const input: CreateStudentInput = { fullName, foodPassCode };
  const student: Student = {
    id: `std_${Math.random().toString(36).slice(2, 10)}`,
    ...input,
    photoUrl: "",
    subscriptionActive: true,
    createdAt: new Date().toISOString(),
  };

  students = [...students, student];

  recordAudit("STUDENT_CREATED", `${student.fullName} (${student.foodPassCode})`);

  return { ok: true, data: student };
}

type UpdateSubscriptionRequestBody = { active?: unknown };

function handleUpdateSubscription(studentId: string, options?: RequestInit): ApiResult<Student> {
  const student = students.find((candidate) => candidate.id === studentId);
  if (!student) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdateSubscriptionRequestBody>(options);
  if (typeof body?.active !== "boolean") {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  student.subscriptionActive = body.active;

  recordAudit(
    "SUBSCRIPTION_TOGGLED",
    `${student.fullName} — abonnement ${student.subscriptionActive ? "activé" : "désactivé"}`,
  );

  return { ok: true, data: student };
}

type UpdatePhotoRequestBody = { photoUrl?: unknown };

/**
 * Simulation d'upload — pas de vrai fichier binaire à ce stade, juste une
 * URL/chaîne texte. La vraie gestion d'upload de fichier viendra avec
 * l'intégration backend réelle.
 */
function handleUpdatePhoto(studentId: string, options?: RequestInit): ApiResult<Student> {
  const student = students.find((candidate) => candidate.id === studentId);
  if (!student) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdatePhotoRequestBody>(options);
  const photoUrl = typeof body?.photoUrl === "string" ? body.photoUrl.trim() : null;

  if (photoUrl === null) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  student.photoUrl = photoUrl;

  return { ok: true, data: student };
}

const STUDENT_SUBSCRIPTION_PATTERN = /^\/api\/v1\/admin\/students\/([^/]+)\/subscription$/;
const STUDENT_PHOTO_PATTERN = /^\/api\/v1\/admin\/students\/([^/]+)\/photo$/;

let mealUsages: MealUsage[] = [];

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function handleFoodPassLookup(code: string): ApiResult<FoodPassLookupResult> {
  const student = students.find((candidate) => candidate.foodPassCode === code);
  if (!student) {
    return {
      ok: false,
      error: { code: "INVALID_QR", message: getErrorMessage("INVALID_QR"), status: 404 },
    };
  }

  const today = todayDateString();
  const usedToday = mealUsages.filter((usage) => usage.studentId === student.id && usage.date === today);

  const alreadyUsedToday: Partial<Record<MealType, boolean>> = {};
  for (const mealType of ["LUNCH", "DINNER"] as MealType[]) {
    if (usedToday.some((usage) => usage.mealType === mealType)) {
      alreadyUsedToday[mealType] = true;
    }
  }

  return {
    ok: true,
    data: {
      student,
      subscriptionActive: student.subscriptionActive,
      alreadyUsedToday,
    },
  };
}

type DistributeRequestBody = { studentId?: unknown; mealType?: unknown };

function isMealType(value: unknown): value is MealType {
  return value === "LUNCH" || value === "DINNER";
}

/**
 * Revérifie systématiquement qu'aucun MealUsage n'existe déjà pour cet
 * étudiant/type/date avant d'en créer un — même logique de
 * vérification-avant-écriture qu'attendrait le vrai backend pour garantir
 * qu'un seul scan simultané réussit. En JS mono-thread ce n'est pas un
 * vrai test de concurrence (pas de requêtes réellement parallèles ici),
 * mais le principe de vérification est identique.
 */
function handleDistributeMeal(options?: RequestInit): ApiResult<MealUsage> {
  const body = parseJsonBody<DistributeRequestBody>(options);
  const studentId = typeof body?.studentId === "string" ? body.studentId : null;
  const mealType = isMealType(body?.mealType) ? body.mealType : null;

  if (!studentId || !mealType) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  const student = students.find((candidate) => candidate.id === studentId);
  if (!student) {
    return {
      ok: false,
      error: { code: "INVALID_QR", message: getErrorMessage("INVALID_QR"), status: 404 },
    };
  }

  // Défense en profondeur : ne jamais faire confiance qu'à l'UI, même si
  // le bouton est censé être désactivé côté client pour un abonnement
  // inactif.
  if (!student.subscriptionActive) {
    return {
      ok: false,
      error: { code: "SUBSCRIPTION_INACTIVE", message: getErrorMessage("SUBSCRIPTION_INACTIVE"), status: 403 },
    };
  }

  const today = todayDateString();
  const alreadyUsed = mealUsages.some(
    (usage) => usage.studentId === studentId && usage.mealType === mealType && usage.date === today,
  );

  if (alreadyUsed) {
    return {
      ok: false,
      error: { code: "MEAL_ALREADY_USED", message: getErrorMessage("MEAL_ALREADY_USED"), status: 409 },
    };
  }

  const usage: MealUsage = {
    id: `meal_${Math.random().toString(36).slice(2, 10)}`,
    studentId,
    mealType,
    date: today,
    distributedAt: new Date().toISOString(),
    distributedBy: "Staff (mode dev)",
  };
  mealUsages = [usage, ...mealUsages];

  recordAudit("MEAL_DISTRIBUTED", `${student.fullName} — ${MEAL_TYPE_LABELS[mealType]}`);

  return { ok: true, data: usage };
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

  const previousStatus = order.status;
  order.status = targetStatus;

  recordAudit("ORDER_TRANSITIONED", `${order.code} : ${previousStatus} → ${targetStatus}`);

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

// Comptes staff fictifs (W10.3) — 3-4 rôles différents pour la démo.
const staffUsers: StaffUser[] = [
  { id: "user_1", name: "Hamza K.", role: "SYSTEM_ADMIN", active: true, createdAt: "2026-01-01T08:00:00.000Z" },
  { id: "user_2", name: "Amine T.", role: "CASHIER", active: true, createdAt: "2026-01-05T08:00:00.000Z" },
  { id: "user_3", name: "Lina B.", role: "KITCHEN_STAFF", active: true, createdAt: "2026-01-10T08:00:00.000Z" },
  { id: "user_4", name: "Sara M.", role: "STOCK_MANAGER", active: false, createdAt: "2026-01-15T08:00:00.000Z" },
];

function handleGetUsers(): ApiResult<StaffUser[]> {
  return { ok: true, data: staffUsers };
}

function isRoleValue(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

type UpdateUserRoleRequestBody = { role?: unknown };

function handleUpdateUserRole(userId: string, options?: RequestInit): ApiResult<StaffUser> {
  const user = staffUsers.find((candidate) => candidate.id === userId);
  if (!user) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdateUserRoleRequestBody>(options);
  if (!isRoleValue(body?.role)) {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  user.role = body.role;

  return { ok: true, data: user };
}

type UpdateUserActiveRequestBody = { active?: unknown };

function handleUpdateUserActive(userId: string, options?: RequestInit): ApiResult<StaffUser> {
  const user = staffUsers.find((candidate) => candidate.id === userId);
  if (!user) {
    return {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: getErrorMessage("INTERNAL_ERROR"), status: 404 },
    };
  }

  const body = parseJsonBody<UpdateUserActiveRequestBody>(options);
  if (typeof body?.active !== "boolean") {
    return {
      ok: false,
      error: { code: "VALIDATION_ERROR", message: getErrorMessage("VALIDATION_ERROR"), status: 422 },
    };
  }

  user.active = body.active;

  return { ok: true, data: user };
}

function handleGetAuditLog(): ApiResult<AuditLogEntry[]> {
  return { ok: true, data: auditLog.slice(0, 50) };
}

const USER_ROLE_PATTERN = /^\/api\/v1\/admin\/users\/([^/]+)\/role$/;
const USER_ACTIVE_PATTERN = /^\/api\/v1\/admin\/users\/([^/]+)\/active$/;

// Commandes comptées comme "chiffre d'affaires" — tout statut à partir de
// PAID (payé), jusqu'aux statuts terminaux positifs. Exclut
// DRAFT/CREATED/AWAITING_PAYMENT (pas encore payées) et
// CANCELLED/EXPIRED/REFUNDED/NO_SHOW (pas comptées comme vente).
const REVENUE_STATUSES: OrderStatus[] = ["PAID", "QUEUED", "PREPARING", "READY", "COLLECTED", "COMPLETED"];

/**
 * Agrégation pure des données déjà en mémoire (commandes, stock, cantine)
 * — aucune nouvelle donnée métier inventée ici. "Récent" pour le
 * gaspillage = tout ce qui est actuellement en mémoire (les mocks n'ont
 * pas d'historique au-delà du reload, donc pas de fenêtre de date
 * arbitraire à inventer). ordersByPaymentMethod reste `null` : voir le
 * commentaire sur DirectionKpi (mode de paiement non persisté sur Order).
 */
function handleGetDirectionKpi(): ApiResult<DirectionKpi> {
  const revenueOrders = orders.filter((order) => REVENUE_STATUSES.includes(order.status));
  const totalRevenueCents = revenueOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const orderCount = revenueOrders.length;
  const averageOrderCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0;

  const ordersByChannel = { POS: 0, MOBILE: 0 };
  for (const order of revenueOrders) {
    ordersByChannel[order.channel] += 1;
  }

  const today = todayDateString();
  const canteenMealsDistributedToday = mealUsages.filter((usage) => usage.date === today).length;

  const wasteMovements = stockMovements.filter((movement) => movement.type === "WASTE");
  const stockWasteCount = wasteMovements.length;
  // Valorisation au prix catalogue actuel — estimation, pas un chiffre
  // comptable officiel (voir DirectionKpi.stockWasteEstimatedValueCents).
  const stockWasteEstimatedValueCents = wasteMovements.reduce((sum, movement) => {
    const stockItem = stockItems.find((item) => item.id === movement.stockItemId);
    const product = stockItem ? products.find((candidate) => candidate.id === stockItem.productId) : undefined;
    if (!product) return sum;
    return sum + Math.abs(movement.quantityDelta) * product.priceCents;
  }, 0);

  // Même logique de filtrage que handleGetStockAlerts (W8).
  const lowStockAlertsCount = stockItems.filter((item) => item.quantityOnHand <= item.lowStockThreshold).length;

  return {
    ok: true,
    data: {
      totalRevenueCents,
      orderCount,
      averageOrderCents,
      ordersByChannel,
      ordersByPaymentMethod: null,
      canteenMealsDistributedToday,
      stockWasteCount,
      stockWasteEstimatedValueCents,
      lowStockAlertsCount,
    },
  };
}

const ORDER_DETAIL_PATTERN = /^\/api\/v1\/orders\/([^/]+)$/;
const ORDER_TRANSITION_PATTERN = /^\/api\/v1\/orders\/([^/]+)\/transition$/;

const PRODUCT_AVAILABILITY_PATTERN = /^\/api\/v1\/products\/([^/]+)\/availability$/;
const PRODUCT_DETAIL_PATTERN = /^\/api\/v1\/products\/([^/]+)$/;
const PROMOTION_ACTIVE_PATTERN = /^\/api\/v1\/promotions\/([^/]+)\/active$/;

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
  "GET /api/v1/inventory/alerts": handleGetStockAlerts,

  "POST /api/v1/canteen/distribute": handleDistributeMeal,

  "GET /api/v1/admin/students": handleGetStudents,
  "POST /api/v1/admin/students": handleCreateStudent,

  "GET /api/v1/admin/users": handleGetUsers,
  "GET /api/v1/admin/audit-log": handleGetAuditLog,

  "GET /api/v1/promotions": handleGetPromotions,
  "POST /api/v1/promotions": handleCreatePromotion,

  "GET /api/v1/direction/kpi": handleGetDirectionKpi,
};

export function resolveMock<T>(path: string, options?: RequestInit): ApiResult<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const [pathname, queryString] = path.split("?");

  if (method === "GET") {
    const orderMatch = pathname.match(ORDER_DETAIL_PATTERN);
    if (orderMatch) return handleGetOrder(orderMatch[1]) as ApiResult<T>;

    const movementsMatch = pathname.match(STOCK_MOVEMENTS_PATTERN);
    if (movementsMatch) return handleGetStockMovements(movementsMatch[1]) as ApiResult<T>;

    if (pathname === "/api/v1/canteen/lookup") {
      const code = new URLSearchParams(queryString ?? "").get("code") ?? "";
      return handleFoodPassLookup(code) as ApiResult<T>;
    }
  }
  if (method === "POST") {
    const transitionMatch = pathname.match(ORDER_TRANSITION_PATTERN);
    if (transitionMatch) return handleOrderTransition(transitionMatch[1], options) as ApiResult<T>;

    const adjustMatch = pathname.match(STOCK_ADJUST_PATTERN);
    if (adjustMatch) return handleAdjustStock(adjustMatch[1], options) as ApiResult<T>;

    const wasteMatch = pathname.match(STOCK_WASTE_PATTERN);
    if (wasteMatch) return handleWasteStock(wasteMatch[1], options) as ApiResult<T>;

    const receiveMatch = pathname.match(STOCK_RECEIVE_PATTERN);
    if (receiveMatch) return handleReceiveStock(receiveMatch[1], options) as ApiResult<T>;

    const photoMatch = pathname.match(STUDENT_PHOTO_PATTERN);
    if (photoMatch) return handleUpdatePhoto(photoMatch[1], options) as ApiResult<T>;
  }
  if (method === "PATCH") {
    const subscriptionMatch = pathname.match(STUDENT_SUBSCRIPTION_PATTERN);
    if (subscriptionMatch) return handleUpdateSubscription(subscriptionMatch[1], options) as ApiResult<T>;

    const userRoleMatch = pathname.match(USER_ROLE_PATTERN);
    if (userRoleMatch) return handleUpdateUserRole(userRoleMatch[1], options) as ApiResult<T>;

    const userActiveMatch = pathname.match(USER_ACTIVE_PATTERN);
    if (userActiveMatch) return handleUpdateUserActive(userActiveMatch[1], options) as ApiResult<T>;

    const availabilityMatch = pathname.match(PRODUCT_AVAILABILITY_PATTERN);
    if (availabilityMatch) return handleUpdateProductAvailability(availabilityMatch[1], options) as ApiResult<T>;

    const productDetailMatch = pathname.match(PRODUCT_DETAIL_PATTERN);
    if (productDetailMatch) return handleUpdateProduct(productDetailMatch[1], options) as ApiResult<T>;

    const promotionActiveMatch = pathname.match(PROMOTION_ACTIVE_PATTERN);
    if (promotionActiveMatch) return handleUpdatePromotionActive(promotionActiveMatch[1], options) as ApiResult<T>;
  }

  const handler = mockHandlers[`${method} ${pathname}`];

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
