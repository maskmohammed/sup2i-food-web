"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "./client";
import type { ApiError } from "./types";

type QueryStatus = "loading" | "success" | "error";

type UseApiQueryResult<T> = {
  status: QueryStatus;
  data?: T;
  error?: ApiError;
  refetch: () => void;
};

export function useApiQuery<T>(path: string): UseApiQueryResult<T> {
  const [status, setStatus] = useState<QueryStatus>("loading");
  const [data, setData] = useState<T>();
  const [error, setError] = useState<ApiError>();
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    apiFetch<T>(path).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setData(result.data);
        setError(undefined);
        setStatus("success");
      } else {
        setError(result.error);
        setData(undefined);
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [path, reloadToken]);

  const refetch = useCallback(() => {
    setStatus("loading");
    setReloadToken((token) => token + 1);
  }, []);

  return { status, data, error, refetch };
}
