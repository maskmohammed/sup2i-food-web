"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { ORDER_STATUS_COLOR_CLASS, ORDER_STATUS_LABELS } from "@/lib/api/orders-types";
import type { Order } from "@/lib/api/orders-types";

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

export default function OrdersPage() {
  const { status, data, error, refetch } = useApiQuery<Order[]>("/api/v1/orders");

  return (
    <div>
      <h1 className="text-lg font-semibold text-text">Commandes</h1>
      <p className="mt-1 text-sm text-text-muted">
        Vue d&apos;ensemble des commandes — données mockées.
      </p>

      <div className="mt-6">
        {status === "loading" ? <LoadingState label="Chargement des commandes..." /> : null}

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
            <EmptyState title="Aucune commande" description="Aucune commande à afficher pour le moment." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-surface-raised">
              <div className="grid min-w-[560px] grid-cols-[1fr_1fr_1fr_1fr] gap-x-4 border-b border-border px-4 py-3 text-sm font-medium text-text-muted">
                <span>Code</span>
                <span>Statut</span>
                <span>Total</span>
                <span>Canal</span>
              </div>
              <div className="flex min-w-[560px] flex-col">
                {data.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-x-4 border-b border-border px-4 py-3 text-sm text-text transition-colors last:border-0 hover:bg-surface"
                  >
                    <span className="font-mono">{order.code}</span>
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 flex-none rounded-full ${ORDER_STATUS_COLOR_CLASS[order.status]}`}
                      />
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    <span className="font-mono">{formatPrice(order.totalCents)}</span>
                    <span className="text-text-muted">{order.channel === "POS" ? "POS" : "Mobile"}</span>
                  </Link>
                ))}
              </div>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
