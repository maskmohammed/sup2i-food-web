import { getErrorMessage } from "@/lib/error-messages";
import { resolveMock } from "./mocks";
import type { ApiError, ApiResult } from "./types";

const API_MODE: "mock" | "live" = process.env.NEXT_PUBLIC_API_MODE === "live" ? "live" : "mock";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

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
  if (API_MODE === "mock") {
    await randomDelay();
    return resolveMock<T>(path, options);
  }

  try {
    const response = await fetch(`${API_URL}${path}`, options);

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
    return { ok: false, error: buildError(0, "INTERNAL_ERROR") };
  }
}
