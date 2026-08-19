/**
 * Mocks de développement — ne reflètent pas nécessairement les vrais
 * contrats API tant que l'OpenAPI officiel n'est pas confirmé avec le
 * Dev Backend. Codes d'erreur : voir src/lib/error-messages.ts.
 */
import { getErrorMessage } from "@/lib/error-messages";
import type { ApiResult } from "../types";

export type OrderStatus =
  | "DRAFT"
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "QUEUED"
  | "PREPARING"
  | "READY"
  | "COLLECTED"
  | "COMPLETED";

export type MockOrder = {
  id: string;
  reference: string;
  status: OrderStatus;
  totalCents: number;
};

const mockOrders: MockOrder[] = [
  { id: "ord_1", reference: "A-1042", status: "PREPARING", totalCents: 850 },
  { id: "ord_2", reference: "A-1043", status: "QUEUED", totalCents: 1200 },
  { id: "ord_3", reference: "A-1044", status: "READY", totalCents: 640 },
];

type MockHandler = () => ApiResult<unknown>;

/** Clé = "MÉTHODE chemin". Pas de vraie route Next — juste un registre en mémoire. */
const mockHandlers: Record<string, MockHandler> = {
  "GET /api/v1/health": () => ({ ok: true, data: { status: "ok" } }),

  "GET /api/v1/orders": () => ({ ok: true, data: mockOrders }),

  // Endpoint de démonstration uniquement, pour tester le flux error-state.
  "GET /api/v1/demo/out-of-stock": () => ({
    ok: false,
    error: {
      code: "OUT_OF_STOCK",
      message: getErrorMessage("OUT_OF_STOCK"),
      status: 409,
    },
  }),
};

export function resolveMock<T>(path: string, options?: RequestInit): ApiResult<T> {
  const method = (options?.method ?? "GET").toUpperCase();
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

  return handler() as ApiResult<T>;
}
