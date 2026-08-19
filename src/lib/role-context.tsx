"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ROLES, type Role } from "@/lib/roles";

const STORAGE_KEY = "sup2i-dev-role";
const ROLE_CHANGE_EVENT = "sup2i-dev-role-change";
const DEFAULT_ROLE: Role = "SYSTEM_ADMIN";

function isRole(value: string | null): value is Role {
  return value !== null && (ROLES as string[]).includes(value);
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ROLE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(ROLE_CHANGE_EVENT, callback);
  };
}

function getSnapshot(): Role {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isRole(stored) ? stored : DEFAULT_ROLE;
}

function getServerSnapshot(): Role {
  return DEFAULT_ROLE;
}

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const role = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setRole = useCallback((next: Role) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
  }, []);

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}

/**
 * Utilisé par AuthProvider pour proposer le rôle renvoyé par le login (mock)
 * comme valeur initiale du sélecteur dev — sans jamais écraser un choix déjà
 * fait manuellement dans le sélecteur. Temporaire tant que l'auth réelle
 * backend ne fournit pas le vrai rôle RBAC.
 */
export function setInitialRoleFromAuth(role: Role) {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(STORAGE_KEY)) return;
  window.localStorage.setItem(STORAGE_KEY, role);
  window.dispatchEvent(new Event(ROLE_CHANGE_EVENT));
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole doit être utilisé à l'intérieur d'un RoleProvider");
  }
  return ctx;
}
