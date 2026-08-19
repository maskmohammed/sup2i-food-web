/**
 * Codes d'erreur : voir src/lib/error-messages.ts (source de référence
 * unique, ne pas redéfinir la liste ici).
 */
export type ApiError = {
  code: string;
  message: string;
  traceId?: string;
  status: number;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };
