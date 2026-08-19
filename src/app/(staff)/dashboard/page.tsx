import { StockAlertsCard } from "./stock-alerts-card";

const statusCards: { label: string; value: number; colorClass: string }[] = [
  { label: "En attente", value: 3, colorClass: "bg-status-queued" },
  { label: "En préparation", value: 2, colorClass: "bg-status-preparing" },
  { label: "Prêtes", value: 5, colorClass: "bg-status-ready" },
  { label: "Problème", value: 1, colorClass: "bg-status-alert" },
];

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
        <StockAlertsCard />
      </div>
    </div>
  );
}
