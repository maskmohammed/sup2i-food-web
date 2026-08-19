import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { LoadingState } from "@/components/states/loading-state";

const statusCards: { label: string; value: number; colorClass: string }[] = [
  { label: "En attente", value: 3, colorClass: "bg-status-queued" },
  { label: "En préparation", value: 2, colorClass: "bg-status-preparing" },
  { label: "Prêtes", value: 5, colorClass: "bg-status-ready" },
  { label: "Problème", value: 1, colorClass: "bg-status-alert" },
];

function DemoRetryButton() {
  return (
    <button
      type="button"
      className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
    >
      Réessayer
    </button>
  );
}

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-lg font-semibold text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">
        Vue d&apos;ensemble simulée — aucune donnée réelle à ce stade.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => (
          <div
            key={card.label}
            className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-4"
          >
            <span
              aria-hidden
              className={`h-3 w-3 flex-none rounded-full ${card.colorClass}`}
            />
            <div>
              <p className="font-mono text-2xl font-semibold text-text">
                {card.value}
              </p>
              <p className="text-sm text-text-muted">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-dashed border-accent-warm p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-accent-warm">
          Aperçu des états UI — à retirer plus tard
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          <LoadingState />
          <EmptyState title="Aucune commande" description="Rien à afficher pour le moment.">
            <DemoRetryButton />
          </EmptyState>
          <ErrorState code="OUT_OF_STOCK">
            <DemoRetryButton />
          </ErrorState>
          <ErrorState code="INTERNAL_ERROR" traceId="trc_7f3a9c21">
            <DemoRetryButton />
          </ErrorState>
        </div>
      </div>
    </div>
  );
}
