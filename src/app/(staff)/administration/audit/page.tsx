"use client";

import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { RequireRole } from "@/components/require-role";
import { NAV_SECTION_ROLES, ROLE_LABELS } from "@/lib/roles";
import type { AuditLogEntry } from "@/lib/api/admin-types";

export default function AuditPage() {
  const { status, data, error, refetch } = useApiQuery<AuditLogEntry[]>("/api/v1/admin/audit-log");

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.audit}>
      <div>
        <h1 className="text-lg font-semibold text-text">Journal d&apos;audit</h1>
        <p className="mt-1 text-sm text-text-muted">
          Actions sensibles récentes (50 dernières) — données mockées.
        </p>

        <div className="mt-6">
          {status === "loading" ? <LoadingState label="Chargement du journal..." /> : null}

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
              <EmptyState title="Aucune entrée" description="Aucune action enregistrée pour le moment." />
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-raised">
                {data.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-1 p-4 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs text-text-muted">
                        {new Date(entry.timestamp).toLocaleString("fr-FR")}
                      </span>
                      <span className="flex-none rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">
                        {entry.action}
                      </span>
                    </div>
                    <p className="text-text">{entry.details}</p>
                    <p className="text-xs text-text-muted">
                      {entry.actorName} — {ROLE_LABELS[entry.actorRole]}
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </div>
    </RequireRole>
  );
}
