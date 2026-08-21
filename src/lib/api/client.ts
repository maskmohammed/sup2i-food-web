import { getErrorMessage } from "@/lib/error-messages";
import { resolveMock } from "./mocks";
import { getNetworkFailureRate } from "./network-simulator";
import type { ApiError, ApiResult } from "./types";

const API_MODE: "mock" | "live" = process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const LIVE_TIMEOUT_MS = 8000;

function randomDelay(minMs = 300, maxMs = 600): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusToCode(status: number): string {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "PERMISSION_DENIED";
  if (status === 429) return "RATE_LIMITED";
  return "INTERNAL_ERROR";
}

function buildError(status: number, code: string, traceId?: string): ApiError {
  return { code, message: getErrorMessage(code), status, traceId };
}

function readErrorBody(body: unknown): { code?: string; traceId?: string } {
  if (typeof body !== "object" || body === null || !("error" in body)) {
    return {};
  }
  const { error } = body as { error?: { code?: unknown; traceId?: unknown } };
  return {
    code: typeof error?.code === "string" ? error.code : undefined,
    traceId: typeof error?.traceId === "string" ? error.traceId : undefined,
  };
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  // Simulateur de panne réseau (dev/tests) — court-circuite avant tout
  // appel réel. `getNetworkFailureRate()` vaut 0 par défaut (fonction
  // renvoie immédiatement false sans même appeler Math.random()), donc le
  // comportement normal n'est jamais ralenti ni modifié.
  const failureRate = getNetworkFailureRate();
  if (failureRate > 0 && Math.random() < failureRate) {
    // 1 fois sur 10 (parmi les pannes simulées) : délai anormalement long
    // avant l'échec, pour visualiser les états de chargement prolongés.
    if (Math.random() < 0.1) {
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
    return { ok: false, error: buildError(0, "NETWORK_ERROR") };
  }

  if (API_MODE === "mock") {
    await randomDelay();
    return resolveMock<T>(path, options);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, { ...options, signal: controller.signal });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const { code, traceId } = readErrorBody(body);
      return { ok: false, error: buildError(response.status, code ?? statusToCode(response.status), traceId) };
    }

    return { ok: true, data: body as T };
  } catch {
    // Regroupe timeout (abort) et échecs réseau réels (DNS, connexion
    // refusée...) sous le même code — l'UI n'a pas besoin de distinguer.
    return { ok: false, error: buildError(0, "NETWORK_ERROR") };
  } finally {
    clearTimeout(timeoutId);
  }
}
