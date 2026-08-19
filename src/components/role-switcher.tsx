"use client";

import { ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { useRole } from "@/lib/role-context";

export function RoleSwitcher() {
  const { role, setRole } = useRole();

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-full border border-accent-warm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-warm">
        Mode dev
      </span>
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
        aria-label="Rôle simulé"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
