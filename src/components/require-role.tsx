"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useRole } from "@/lib/role-context";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import type { Role } from "@/lib/roles";

function subscribeNoop() {
  return () => {};
}
function getHydratedSnapshot() {
  return true;
}
function getServerHydratedSnapshot() {
  return false;
}

/**
 * Vrai une fois que le rôle actif a pu être lu depuis localStorage côté
 * client (voir role-context.tsx : getServerSnapshot renvoie SYSTEM_ADMIN
 * par défaut, le rôle le plus permissif, avant hydratation). Sans cette
 * garde, RequireRole afficherait brièvement le contenu protégé à
 * n'importe quel rôle avant de corriger — pas juste un flash d'erreur
 * inoffensif.
 */
function useHasHydrated(): boolean {
  return useSyncExternalStore(subscribeNoop, getHydratedSnapshot, getServerHydratedSnapshot);
}

export function RequireRole({ allowedRoles, children }: { allowedRoles: Role[]; children: ReactNode }) {
  const { role } = useRole();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingState label="Vérification des droits d'accès..." />
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <ErrorState code="PERMISSION_DENIED" />
      </div>
    );
  }

  return <>{children}</>;
}
