"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { apiFetch } from "@/lib/api/client";
import type { ApiResult } from "@/lib/api/types";
import type { MockLoginResponse } from "@/lib/api/mocks";
import { setInitialRoleFromAuth } from "@/lib/role-context";
import type { Role } from "@/lib/roles";

const TOKEN_KEY = "sup2i_auth_token";
const USER_KEY = "sup2i_auth_user";
const AUTH_CHANGE_EVENT = "sup2i-auth-change";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";
type AuthUser = { name: string; role: Role };
type AuthSnapshot = { status: AuthStatus; token: string | null; user: AuthUser | null };

const SERVER_SNAPSHOT: AuthSnapshot = { status: "loading", token: null, user: null };
const UNAUTHENTICATED_SNAPSHOT: AuthSnapshot = { status: "unauthenticated", token: null, user: null };

// Cache mémoïsé : useSyncExternalStore exige une référence stable tant que
// les données lues n'ont pas réellement changé, sous peine de re-render en boucle.
let lastToken: string | null = null;
let lastUserJson: string | null = null;
let cachedSnapshot: AuthSnapshot = UNAUTHENTICATED_SNAPSHOT;

function isAuthUser(value: unknown): value is AuthUser {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { role?: unknown }).role === "string"
  );
}

function getSnapshot(): AuthSnapshot {
  const token = window.localStorage.getItem(TOKEN_KEY);
  const userJson = window.localStorage.getItem(USER_KEY);

  if (token === lastToken && userJson === lastUserJson) {
    return cachedSnapshot;
  }
  lastToken = token;
  lastUserJson = userJson;

  let user: AuthUser | null = null;
  if (userJson) {
    try {
      const parsed: unknown = JSON.parse(userJson);
      if (isAuthUser(parsed)) user = parsed;
    } catch {
      user = null;
    }
  }

  cachedSnapshot = token && user ? { status: "authenticated", token, user } : UNAUTHENTICATED_SNAPSHOT;
  return cachedSnapshot;
}

function getServerSnapshot(): AuthSnapshot {
  return SERVER_SNAPSHOT;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_CHANGE_EVENT, callback);
  };
}

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (identifiant: string, motDePasse: string) => Promise<ApiResult<MockLoginResponse>>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    // Rôle simulé (mode dev) : tant que le login ne renvoie pas encore le
    // vrai rôle RBAC backend, on propose le rôle retourné par le mock comme
    // valeur initiale du sélecteur dev — sans jamais écraser un choix déjà
    // fait manuellement (cf. src/lib/role-context.tsx). À retirer quand
    // l'auth réelle backend fournira le vrai rôle.
    if (snapshot.status === "authenticated" && snapshot.user) {
      setInitialRoleFromAuth(snapshot.user.role);
    }
  }, [snapshot.status, snapshot.user]);

  async function login(identifiant: string, motDePasse: string): Promise<ApiResult<MockLoginResponse>> {
    const result = await apiFetch<MockLoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifiant, motDePasse }),
    });

    if (result.ok) {
      window.localStorage.setItem(TOKEN_KEY, result.data.token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(result.data.user));
      window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
    }

    return result;
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }

  return (
    <AuthContext.Provider value={{ status: snapshot.status, user: snapshot.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return ctx;
}
