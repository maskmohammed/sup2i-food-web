"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { ApiError } from "@/lib/api/types";
import type { StockItem, StockMovement, StockMovementType } from "@/lib/api/inventory-types";

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  RECEIPT: "Réception",
  SALE_DEDUCTION: "Vente",
  ADJUSTMENT: "Ajustement",
  WASTE: "Gaspillage",
};

function AdjustForm({
  item,
  onCancel,
  onAdjusted,
}: {
  item: StockItem;
  onCancel: () => void;
  onAdjusted: () => void;
}) {
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [amountInput, setAmountInput] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const amount = Number(amountInput);
    const quantityDelta = direction === "add" ? amount : -amount;

    setSubmitting(true);
    setError(null);

    const result = await apiFetch<StockItem>(`/api/v1/inventory/items/${item.id}/adjust`, {
      method: "POST",
      body: JSON.stringify({ quantityDelta, reason }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onAdjusted();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex gap-2">
        {(["add", "remove"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDirection(option)}
            className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
              direction === option
                ? "border-brand bg-brand/10 text-text"
                : "border-border bg-surface-raised text-text-muted hover:text-text"
            }`}
          >
            {option === "add" ? "Ajouter" : "Retirer"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`amount-${item.id}`} className="text-sm text-text-muted">
          Quantité ({item.unit})
        </label>
        <input
          id={`amount-${item.id}`}
          type="number"
          min="0"
          step="0.01"
          required
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`reason-${item.id}`} className="text-sm text-text-muted">
          Motif
        </label>
        <input
          id={`reason-${item.id}`}
          type="text"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-brand"
        />
      </div>

      {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted transition-colors hover:text-text disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Ajustement..." : "Confirmer"}
        </button>
      </div>
    </form>
  );
}

function MovementHistory({ itemId }: { itemId: string }) {
  const { status, data, error, refetch } = useApiQuery<StockMovement[]>(
    `/api/v1/inventory/items/${itemId}/movements`,
  );

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface p-3">
      {status === "loading" ? <LoadingState label="Chargement de l'historique..." /> : null}

      {status === "error" && error ? (
        <ErrorState code={error.code} traceId={error.traceId}>
          <button
            type="button"
            onClick={refetch}
            className="rounded-md border border-border bg-surface-raised px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface"
          >
            Réessayer
          </button>
        </ErrorState>
      ) : null}

      {status === "success" && data ? (
        data.length === 0 ? (
          <p className="text-sm text-text-muted">Aucun mouvement enregistré.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {data.map((movement) => (
              <li key={movement.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-text">
                    {MOVEMENT_TYPE_LABELS[movement.type]}
                    {movement.reason ? ` — ${movement.reason}` : ""}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(movement.createdAt).toLocaleString("fr-FR")} — {movement.createdBy}
                  </p>
                </div>
                <span
                  className={`flex-none font-mono text-sm ${
                    movement.quantityDelta < 0 ? "text-status-alert" : "text-text"
                  }`}
                >
                  {movement.quantityDelta > 0 ? "+" : ""}
                  {movement.quantityDelta}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}

export default function StockPage() {
  const { status, data, error, refetch } = useApiQuery<StockItem[]>("/api/v1/inventory/items");
  const [expanded, setExpanded] = useState<{ itemId: string; mode: "adjust" | "history" } | null>(null);

  function toggleHistory(itemId: string) {
    setExpanded((prev) => (prev?.itemId === itemId && prev.mode === "history" ? null : { itemId, mode: "history" }));
  }

  function toggleAdjust(itemId: string) {
    setExpanded((prev) => (prev?.itemId === itemId && prev.mode === "adjust" ? null : { itemId, mode: "adjust" }));
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-text">Stock</h1>
      <p className="mt-1 text-sm text-text-muted">
        Cliquez sur un article pour voir son historique de mouvements.
      </p>

      <div className="mt-6">
        {status === "loading" ? <LoadingState label="Chargement du stock..." /> : null}

        {status === "error" && error ? (
          <ErrorState code={error.code} traceId={error.traceId}>
            <button
              type="button"
              onClick={refetch}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
            >
              Réessayer
            </button>
          </ErrorState>
        ) : null}

        {status === "success" && data ? (
          data.length === 0 ? (
            <EmptyState title="Aucun article de stock" description="Aucun article n'est encore suivi." />
          ) : (
            <ul className="flex flex-col gap-3">
              {data.map((item) => {
                const lowStock = item.quantityOnHand <= item.lowStockThreshold;
                const isExpanded = expanded?.itemId === item.id;

                return (
                  <li key={item.id} className="rounded-lg border border-border bg-surface-raised p-4">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => toggleHistory(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          aria-hidden
                          className={`h-2.5 w-2.5 flex-none rounded-full ${
                            lowStock ? "bg-status-alert" : "bg-status-ready"
                          }`}
                        />
                        <span className="min-w-0 truncate text-sm font-medium text-text">{item.productName}</span>
                        <span className="flex-none font-mono text-sm text-text-muted">
                          {item.quantityOnHand} {item.unit}
                        </span>
                        {lowStock ? (
                          <span className="flex-none rounded-full border border-status-alert px-2 py-0.5 text-xs text-status-alert">
                            Stock bas
                          </span>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleAdjust(item.id)}
                        className="flex-none rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
                      >
                        Ajuster
                      </button>
                    </div>

                    {isExpanded && expanded?.mode === "adjust" ? (
                      <AdjustForm
                        item={item}
                        onCancel={() => setExpanded(null)}
                        onAdjusted={() => {
                          setExpanded(null);
                          refetch();
                        }}
                      />
                    ) : null}

                    {isExpanded && expanded?.mode === "history" ? <MovementHistory itemId={item.id} /> : null}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
