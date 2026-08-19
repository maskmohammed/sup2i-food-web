"use client";

import { use } from "react";
import Link from "next/link";
import { useApiQuery } from "@/lib/api/use-api";
import { useOrderTransition } from "@/lib/api/use-order-transition";
import { useRole } from "@/lib/role-context";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import {
  ORDER_STATUS_COLOR_CLASS,
  ORDER_STATUS_LABELS,
  ORDER_TRANSITIONS,
  getAllowedRolesForTransition,
  type Order,
  type OrderStatus,
} from "@/lib/api/orders-types";
import type { Role } from "@/lib/roles";

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

function OrderActions({
  status,
  role,
  pendingTarget,
  onTransition,
}: {
  status: OrderStatus;
  role: Role;
  pendingTarget: OrderStatus | null;
  onTransition: (target: OrderStatus) => void;
}) {
  const availableTargets = ORDER_TRANSITIONS[status].filter((target) =>
    getAllowedRolesForTransition(status, target).includes(role),
  );

  if (availableTargets.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-4 text-sm text-text-muted">
        Aucune action disponible pour votre rôle sur cette commande.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {availableTargets.map((target) => (
        <button
          key={target}
          type="button"
          disabled={pendingTarget !== null}
          onClick={() => onTransition(target)}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-surface-raised disabled:opacity-50"
        >
          {pendingTarget === target ? "..." : ORDER_STATUS_LABELS[target]}
        </button>
      ))}
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { role } = useRole();
  const { status, data, error, refetch } = useApiQuery<Order>(`/api/v1/orders/${id}`);
  const { pendingTarget, error: actionError, transition: handleTransition } = useOrderTransition(id, () =>
    refetch(),
  );

  return (
    <div>
      <Link href="/orders" className="text-sm text-text-muted hover:text-text">
        ← Retour aux commandes
      </Link>

      <div className="mt-4">
        {status === "loading" ? <LoadingState label="Chargement de la commande..." /> : null}

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
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-border bg-surface-raised p-4">
              <div className="flex items-center justify-between">
                <h1 className="font-mono text-lg font-semibold text-text">{data.code}</h1>
                <span className="inline-flex items-center gap-2 text-sm text-text">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 flex-none rounded-full ${ORDER_STATUS_COLOR_CLASS[data.status]}`}
                  />
                  {ORDER_STATUS_LABELS[data.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Canal {data.channel === "POS" ? "POS" : "Mobile"} — créée le{" "}
                {new Date(data.createdAt).toLocaleString("fr-FR")}
              </p>

              <ul className="mt-4 flex flex-col divide-y divide-border">
                {data.items.map((item, index) => (
                  <li key={index} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-text">
                      {item.quantity} × {item.productName}
                    </span>
                    <span className="font-mono text-text-muted">
                      {formatPrice(item.priceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium text-text">Total</span>
                <span className="font-mono text-base font-semibold text-text">
                  {formatPrice(data.totalCents)}
                </span>
              </div>
            </div>

            <OrderActions
              status={data.status}
              role={role}
              pendingTarget={pendingTarget}
              onTransition={handleTransition}
            />

            {actionError ? <ErrorState code={actionError.code} traceId={actionError.traceId} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
