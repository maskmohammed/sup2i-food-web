"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { canAccessSection, type NavSectionId } from "@/lib/roles";
import { useRole } from "@/lib/role-context";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 flex-none"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const navItems: {
  label: string;
  href: string;
  section: NavSectionId;
  icon: ReactNode;
  /** Page réelle (Link, navigation client) vs placeholder pas encore construit (<a>, 404 attendu). */
  implemented?: boolean;
}[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    section: "dashboard",
    implemented: true,
    icon: (
      <NavIcon>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </NavIcon>
    ),
  },
  {
    label: "Commandes",
    href: "/orders",
    section: "orders",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M6 2h9l3 3v17H6z" />
        <path d="M9 8h6M9 12h6M9 16h4" />
      </NavIcon>
    ),
  },
  {
    label: "POS",
    href: "/pos",
    section: "pos",
    implemented: true,
    icon: (
      <NavIcon>
        <rect x="4" y="3" width="16" height="12" rx="2" />
        <path d="M9 21h6" />
        <path d="M12 17v4" />
      </NavIcon>
    ),
  },
  {
    label: "KDS",
    href: "/kds",
    section: "kds",
    implemented: true,
    icon: (
      <NavIcon>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8" />
        <path d="M7 8h6M7 11h4" />
      </NavIcon>
    ),
  },
  {
    label: "Stock",
    href: "/stock",
    section: "stock",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M21 8l-9-5-9 5 9 5 9-5z" />
        <path d="M3 8v8l9 5 9-5V8" />
        <path d="M12 13v8" />
      </NavIcon>
    ),
  },
  {
    label: "Cantine",
    href: "/cantine",
    section: "cantine",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M6 3v7a2 2 0 0 0 4 0V3" />
        <path d="M8 10v11" />
        <path d="M16 3c-1.5 0-2 2-2 4s.5 4 2 4v10" />
      </NavIcon>
    ),
  },
  {
    label: "Administration",
    href: "/administration",
    section: "administration",
    implemented: true,
    icon: (
      <NavIcon>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z" />
      </NavIcon>
    ),
  },
  {
    label: "Catalogue",
    href: "/administration/catalogue",
    section: "catalogue",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M20.59 13.41 12 22l-9-9V4a1 1 0 0 1 1-1h9l9 9a1 1 0 0 1 0 1.41Z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </NavIcon>
    ),
  },
  {
    label: "Étudiants",
    href: "/administration/students",
    section: "students",
    implemented: true,
    icon: (
      <NavIcon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-1a8 8 0 0 1 16 0v1" />
      </NavIcon>
    ),
  },
  {
    label: "Utilisateurs",
    href: "/administration/users",
    section: "users",
    implemented: true,
    icon: (
      <NavIcon>
        <circle cx="9" cy="7" r="3" />
        <path d="M2 21v-1a7 7 0 0 1 14 0v1" />
        <circle cx="18" cy="8" r="2.5" />
        <path d="M16.5 13.5a5 5 0 0 1 5.5 5v1.5" />
      </NavIcon>
    ),
  },
  {
    label: "Audit",
    href: "/administration/audit",
    section: "audit",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M9 3h6l3 3v15H6V6z" />
        <path d="M9 11h6M9 15h6M9 7h2" />
      </NavIcon>
    ),
  },
  {
    label: "Promotions",
    href: "/administration/promotions",
    section: "promotions",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M12 2 2 12l10 10 10-10z" />
        <circle cx="9.5" cy="9.5" r="1.5" />
      </NavIcon>
    ),
  },
  {
    label: "Direction",
    href: "/direction",
    section: "direction",
    implemented: true,
    icon: (
      <NavIcon>
        <path d="M3 3v18h18" />
        <path d="M7 13v5" />
        <path d="M12 9v9" />
        <path d="M17 5v13" />
      </NavIcon>
    ),
  },
];

export function StaffNav() {
  const { role } = useRole();

  const visibleItems = navItems.filter((item) => canAccessSection(role, item.section));
  const items = visibleItems.length > 0 ? visibleItems : navItems.filter((item) => item.section === "dashboard");

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) =>
        item.implemented ? (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ) : (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ),
      )}
    </nav>
  );
}
