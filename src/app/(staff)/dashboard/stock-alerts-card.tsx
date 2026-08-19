"use client";

import { useApiQuery } from "@/lib/api/use-api";
import { useRole } from "@/lib/role-context";
import { canAccessSection } from "@/lib/roles";
import type { StockItem } from "@/lib/api/inventory-types";

export function StockAlertsCard() {
  const { role } = useRole();
  const { status, data } = useApiQuery<StockItem[]>("/api/v1/inventory/alerts");

  if (!canAccessSection(role, "stock")) return null;
  if (status === "error") return null;
  if (status === "success" && data && data.length === 0) return null;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-surface-raised p-4">
      <span aria-hidden className="h-3 w-3 flex-none rounded-full bg-status-alert" />
      <div>
        <p className="font-mono text-2xl font-semibold text-text">
          {status === "success" && data ? data.length : "…"}
        </p>
        <p className="text-sm text-text-muted">Alertes stock</p>
      </div>
    </div>
  );
}
