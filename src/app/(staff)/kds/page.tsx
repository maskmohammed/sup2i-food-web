"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useOrderTransition } from "@/lib/api/use-order-transition";
import { useRole } from "@/lib/role-context";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { getAllowedRolesForTransition, type Order, type OrderStatus } from "@/lib/api/orders-types";
import type { ApiError } from "@/lib/api/types";

const POLL_INTERVAL_MS = 6000;

function formatTime(createdAt: string): string {
  return new Date(createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Un seul bouton pertinent par statut affiché sur le KDS. PAID n'a
 * volontairement aucune action ici : PAID→QUEUED est réservé à
 * CASHIER/SNACK_MANAGER dans ORDER_TRANSITION_ROLES (encaissement/mise en
 * file), pas à KITCHEN_STAFF — cohérent avec la répartition caisse/cuisine
 * déjà posée en W4.
 */
function getCardAction(status: OrderStatus): { label: string; target: OrderStatus } | null {
  if (status === "QUEUED") return { label: "Commencer", target: "PREPARING" };
  if (status === "PREPARING") return { label: "Prête", target: "READY" };
  return null;
}

function KdsCard({ order, onOrderUpdated }: { order: Order; onOrderUpdated: () => void }) {
  const { role } = useRole();
  const { pendingTarget, error, transition } = useOrderTransition(order.id, onOrderUpdated);

  const action = getCardAction(order.status);
  const canAct = action !== null && getAllowedRolesForTransition(order.status, action.target).includes(role);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xl font-semibold text-text">{order.code}</span>
        <span className="text-sm text-text-muted">{formatTime(order.createdAt)}</span>
      </div>

      <ul className="flex flex-col gap-1">
        {order.items.map((item, index) => (
          <li key={index} className="text-base text-text">
            <span className="font-mono">{item.quantity}×</span> {item.productName}
          </li>
        ))}
      </ul>

      {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

      {action && canAct ? (
        <button
          type="button"
          disabled={pendingTarget !== null}
          onClick={() => transition(action.target)}
          className="mt-1 rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pendingTarget ? "..." : action.label}
        </button>
      ) : action ? (
        <p className="mt-1 text-sm text-text-muted">Aucune action disponible pour votre rôle.</p>
      ) : null}
    </div>
  );
}

function KdsColumn({
  title,
  orders,
  onOrderUpdated,
  emptyDescription,
}: {
  title: string;
  orders: Order[];
  onOrderUpdated: () => void;
  emptyDescription: string;
}) {
  return (
    <div>
      <h2 className="mb-3 text-base font-semibold text-text">
        {title} <span className="font-mono text-sm text-text-muted">({orders.length})</span>
      </h2>

      {orders.length === 0 ? (
        <EmptyState title="Aucune commande" description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {orders.map((order) => (
            <KdsCard key={order.id} order={order} onOrderUpdated={onOrderUpdated} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function KdsPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<ApiError | null>(null);

  const reload = useCallback(() => {
    apiFetch<Order[]>("/api/v1/orders").then((result) => {
      if (result.ok) {
        setOrders(result.data);
        setError(null);
        setStatus("success");
      } else {
        setError(result.error);
        setStatus("error");
      }
    });
  }, []);

  useEffect(() => {
    reload();

    // Polling temporaire (pas de vrai WebSocket/SSE à ce stade) — à
    // remplacer par un flux temps réel côté backend si les volumes de
    // commandes le justifient.
    const intervalId = setInterval(reload, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [reload]);

  const preparingQueue = (orders ?? [])
    .filter((order) => order.status === "PAID" || order.status === "QUEUED")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const inProgress = (orders ?? [])
    .filter((order) => order.status === "PREPARING")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div>
      <h1 className="text-lg font-semibold text-text">KDS — Cuisine</h1>
      <p className="mt-1 text-sm text-text-muted">
        Rafraîchissement automatique — commandes payées uniquement.
      </p>

      <div className="mt-6">
        {status === "loading" ? <LoadingState label="Chargement des commandes..." /> : null}

        {status === "error" && error ? (
          <ErrorState code={error.code} traceId={error.traceId}>
            <button
              type="button"
              onClick={reload}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
            >
              Réessayer
            </button>
          </ErrorState>
        ) : null}

        {status === "success" ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <KdsColumn
              title="À préparer"
              orders={preparingQueue}
              onOrderUpdated={reload}
              emptyDescription="Aucune commande à préparer pour le moment."
            />
            <KdsColumn
              title="En préparation"
              orders={inProgress}
              onOrderUpdated={reload}
              emptyDescription="Aucune commande en préparation pour le moment."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
