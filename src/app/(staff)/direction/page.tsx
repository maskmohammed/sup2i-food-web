"use client";

import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { RequireRole } from "@/components/require-role";
import { NAV_SECTION_ROLES } from "@/lib/roles";
import type { DirectionKpi } from "@/lib/api/direction-types";

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

function StatCard({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-4">
      {colorClass ? <span aria-hidden className={`h-3 w-3 flex-none rounded-full ${colorClass}`} /> : null}
      <div className="min-w-0">
        <p className="truncate font-mono text-2xl font-semibold text-text">{value}</p>
        <p className="text-sm text-text-muted">{label}</p>
      </div>
    </div>
  );
}

export default function DirectionPage() {
  const { status, data, error, refetch } = useApiQuery<DirectionKpi>("/api/v1/direction/kpi");

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.direction}>
      <div>
        <h1 className="text-lg font-semibold text-text">Direction</h1>
        <p className="mt-1 text-sm text-text-muted">
          Indicateurs agrégés à partir des données existantes — données mockées.
        </p>

        <div className="mt-6">
          {status === "loading" ? <LoadingState label="Chargement des indicateurs..." /> : null}

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
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Chiffre d'affaires" value={formatPrice(data.totalRevenueCents)} />
                <StatCard label="Panier moyen" value={formatPrice(data.averageOrderCents)} />
                <StatCard label="Commandes" value={String(data.orderCount)} />
                <StatCard
                  label="Repas cantine (aujourd'hui)"
                  value={String(data.canteenMealsDistributedToday)}
                />
                <StatCard label="Commandes POS" value={String(data.ordersByChannel.POS)} />
                <StatCard label="Commandes Mobile" value={String(data.ordersByChannel.MOBILE)} />
                <StatCard
                  label="Alertes stock bas"
                  value={String(data.lowStockAlertsCount)}
                  colorClass={data.lowStockAlertsCount > 0 ? "bg-status-alert" : "bg-status-ready"}
                />
                <StatCard
                  label="Gaspillage (mouvements)"
                  value={String(data.stockWasteCount)}
                  colorClass="bg-status-alert"
                />
                <StatCard
                  label="Gaspillage — valeur estimée"
                  value={formatPrice(data.stockWasteEstimatedValueCents)}
                  colorClass="bg-status-alert"
                />
              </div>

              <p className="mt-4 text-xs text-text-muted">
                La valeur du gaspillage est une estimation basée sur le prix catalogue actuel des produits
                jetés — ce n&apos;est pas un chiffre comptable officiel.
              </p>

              {data.ordersByPaymentMethod === null ? (
                <p className="mt-2 text-xs text-text-muted">
                  Répartition par mode de paiement (Espèces/TPE) : donnée non disponible — le mode de
                  paiement n&apos;est pas encore conservé sur les commandes existantes.
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </RequireRole>
  );
}
