/**
 * Mocks de développement — ne reflètent pas nécessairement les vrais
 * contrats API tant que l'OpenAPI officiel n'est pas confirmé avec le
 * Dev Backend. Codes d'erreur : voir src/lib/error-messages.ts.
 */
import { getErrorMessage } from "@/lib/error-messages";
import type { Role } from "@/lib/roles";
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

export type MockLoginResponse = {
  token: string;
  user: { name: string; role: Role };
};

type LoginRequestBody = { identifiant?: unknown; motDePasse?: unknown };

function parseJsonBody(options?: RequestInit): LoginRequestBody | null {
  if (typeof options?.body !== "string") return null;
  try {
    return JSON.parse(options.body) as LoginRequestBody;
  } catch {
    return null;
  }
}

/**
 * Mock du flux de login — ce n'est PAS le vrai flux JWT/refresh du backend
 * (voir CLAUDE_PROJECT.md, "pending: JWT/RBAC réel"). Le token est une
 * chaîne factice et le rôle retourné est toujours ADMINISTRATION par
 * défaut, faute de vraie permissions matrix au login pour l'instant.
 */
function handleLogin(options?: RequestInit): ApiResult<MockLoginResponse> {
  const body = parseJsonBody(options);
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

type MockHandler = (options?: RequestInit) => ApiResult<unknown>;

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

  "POST /api/v1/auth/login": handleLogin,
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

  return handler(options) as ApiResult<T>;
}
