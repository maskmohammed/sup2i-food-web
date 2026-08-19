import type { ReactNode } from "react";
import { RoleProvider } from "@/lib/role-context";
import { RoleSwitcher } from "@/components/role-switcher";
import { StaffNav } from "@/components/staff-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen">
        <aside className="flex w-56 flex-none flex-col gap-1 bg-surface p-4">
          <p className="px-3 pb-4 text-sm font-semibold tracking-tight text-brand">
            SUP2I Food
          </p>
          <StaffNav />
        </aside>

        <div aria-hidden className="w-0 flex-none border-l-2 border-dashed border-border" />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3">
            <div>
              <p className="text-sm font-medium text-text">Hamza K.</p>
              <p className="text-xs text-text-muted">Session ouverte</p>
            </div>
            <div className="flex items-center gap-3">
              <RoleSwitcher />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 bg-bg p-6">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}
