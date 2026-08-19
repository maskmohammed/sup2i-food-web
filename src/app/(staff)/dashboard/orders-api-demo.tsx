"use client";

import { useState } from "react";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import type { ApiError } from "@/lib/api/types";
import type { MockOrder } from "@/lib/api/mocks";

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
    >
      Réessayer
    </button>
  );
}

export function OrdersApiDemo() {
  const { status, data, error, refetch } = useApiQuery<MockOrder[]>("/api/v1/orders");
  const [demoError, setDemoError] = useState<ApiError | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  async function triggerOutOfStock() {
    setDemoLoading(true);
    const result = await apiFetch("/api/v1/demo/out-of-stock");
    setDemoLoading(false);
    setDemoError(result.ok ? null : result.error);
  }

  return (
    <div className="flex flex-col gap-4">
      {status === "loading" ? <LoadingState label="Chargement des commandes..." /> : null}

      {status === "error" && error ? (
        <ErrorState code={error.code} traceId={error.traceId}>
          <RetryButton onClick={refetch} />
        </ErrorState>
      ) : null}

      {status === "success" && data ? (
        <ul className="space-y-1 font-mono text-sm text-text">
          {data.map((order) => (
            <li key={order.id}>
              {order.reference} — {order.status} — {(order.totalCents / 100).toFixed(2)} €
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-dashed border-border pt-4">
        <button
          type="button"
          onClick={triggerOutOfStock}
          disabled={demoLoading}
          className="w-fit rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised disabled:opacity-50"
        >
          {demoLoading ? "..." : "Déclencher OUT_OF_STOCK"}
        </button>
        {demoError ? <ErrorState code={demoError.code} traceId={demoError.traceId} /> : null}
      </div>
    </div>
  );
}
