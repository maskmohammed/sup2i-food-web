"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { RoleProvider } from "@/lib/role-context";
import { RoleSwitcher } from "@/components/role-switcher";
import { NetworkFailureToggle } from "@/components/network-failure-toggle";
import { StaffNav } from "@/components/staff-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingState } from "@/components/states/loading-state";
import { useAuth } from "@/lib/auth/auth-context";

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 flex-none"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function StaffLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <LoadingState label="Vérification de la session..." />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <RoleProvider>
      <div className="flex min-h-screen">
        <aside className="flex w-56 flex-none flex-col gap-1 bg-surface p-4">
          <p className="px-3 pb-4 text-sm font-semibold tracking-tight text-brand">
            SUP2I Food
          </p>
          <StaffNav />

          {/* Déconnexion — déplacée du header au bas du rail latéral, même
              handleLogout, juste repositionnée visuellement. */}
          <div className="mt-auto border-t border-border pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
            >
              <LogoutIcon />
              <span>Déconnexion</span>
            </button>
          </div>
        </aside>

        <div aria-hidden className="w-0 flex-none border-l-2 border-dashed border-border" />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-border bg-surface px-6 py-3">
            <div className="flex-none">
              <p className="text-sm font-medium text-text">{user?.name}</p>
              <p className="text-xs text-text-muted">Session ouverte</p>
            </div>
            {/*
             * flex-wrap ici (et sur le header) : à largeur réduite, ce
             * groupe passe à la ligne comme un tout, puis ses propres
             * éléments se répartissent sur plusieurs lignes si besoin —
             * jamais de débordement horizontal. Déconnexion vit maintenant
             * dans le rail latéral (voir <aside>), plus dans cette barre.
             */}
            <div className="flex flex-wrap items-center gap-3">
              <RoleSwitcher />
              <NetworkFailureToggle />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 bg-bg p-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
