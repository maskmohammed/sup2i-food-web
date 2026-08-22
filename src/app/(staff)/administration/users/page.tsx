"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { RequireRole } from "@/components/require-role";
import { NAV_SECTION_ROLES, ROLES, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/lib/roles";
import type { ApiError } from "@/lib/api/types";
import type { StaffUser } from "@/lib/api/admin-types";

export default function UsersPage() {
  const { status, data, error, refetch } = useApiQuery<StaffUser[]>("/api/v1/admin/users");

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);

  async function handleRoleChange(user: StaffUser, role: Role) {
    if (pendingId) return;

    setPendingId(user.id);
    setActionError(null);

    const result = await apiFetch<StaffUser>(`/api/v1/admin/users/${user.id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });

    setPendingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    refetch();
  }

  async function handleToggleActive(user: StaffUser) {
    if (pendingId) return;

    setPendingId(user.id);
    setActionError(null);

    const result = await apiFetch<StaffUser>(`/api/v1/admin/users/${user.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active: !user.active }),
    });

    setPendingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    refetch();
  }

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.users}>
      <div>
        <h1 className="text-lg font-semibold text-text">Utilisateurs</h1>
        <p className="mt-1 text-sm text-text-muted">
          Comptes staff, rôle assigné et statut — données mockées.
        </p>

        <div className="mt-6">
          {status === "loading" ? <LoadingState label="Chargement des utilisateurs..." /> : null}

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
              <EmptyState title="Aucun utilisateur" description="Aucun compte staff enregistré." />
            ) : (
              <ul className="flex flex-col gap-3">
                {data.map((user) => (
                  <li
                    key={user.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        aria-hidden
                        className={`h-2.5 w-2.5 flex-none rounded-full ${
                          user.active ? "bg-status-ready" : "bg-status-alert"
                        }`}
                      />
                      <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">{user.name}</p>
                    </div>

                    <div className="flex flex-none items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(event) => handleRoleChange(user, event.target.value as Role)}
                        disabled={pendingId === user.id}
                        aria-label={`Rôle de ${user.name}`}
                        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text outline-none focus:border-brand disabled:opacity-50"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(user)}
                        disabled={pendingId === user.id}
                        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised disabled:opacity-50"
                      >
                        {pendingId === user.id ? "..." : user.active ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        {actionError ? (
          <div className="mt-4">
            <ErrorState code={actionError.code} traceId={actionError.traceId} />
          </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
