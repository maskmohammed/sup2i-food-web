/**
 * Rôles applicatifs simulés côté frontend (mode dev), en attendant le RBAC
 * réel (JWT + permissions backend) prévu en W2.
 *
 * ATTENTION : ce fichier n'est PAS la source de vérité. Le mapping
 * section -> rôles ci-dessous est une proposition frontend à valider avec
 * le Dev Backend / la permissions matrix officielle dès qu'elle sera
 * fournie. Le backend Spring Boot reste seul juge des permissions réelles ;
 * le frontend doit toujours s'attendre à un 403 en cas de désaccord.
 */
export type Role =
  | "STUDENT"
  | "CASHIER"
  | "SNACK_MANAGER"
  | "KITCHEN_STAFF"
  | "CANTEEN_MANAGER"
  | "STOCK_MANAGER"
  | "ADMINISTRATION"
  | "FINANCE"
  | "DIRECTION"
  | "SYSTEM_ADMIN";

export const ROLES: Role[] = [
  "STUDENT",
  "CASHIER",
  "SNACK_MANAGER",
  "KITCHEN_STAFF",
  "CANTEEN_MANAGER",
  "STOCK_MANAGER",
  "ADMINISTRATION",
  "FINANCE",
  "DIRECTION",
  "SYSTEM_ADMIN",
];

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Étudiant",
  CASHIER: "Caissier",
  SNACK_MANAGER: "Responsable Snack",
  KITCHEN_STAFF: "Cuisine",
  CANTEEN_MANAGER: "Responsable Cantine",
  STOCK_MANAGER: "Responsable Stock",
  ADMINISTRATION: "Administration",
  FINANCE: "Finance",
  DIRECTION: "Direction",
  SYSTEM_ADMIN: "Admin Système",
};

export type NavSectionId =
  | "dashboard"
  | "pos"
  | "kds"
  | "stock"
  | "cantine"
  | "administration"
  | "direction"
  | "catalogue"
  | "orders"
  | "students";

/**
 * Proposition frontend d'accès par section, à valider avec le Dev Backend /
 * la permissions matrix officielle. Ne pas traiter comme une règle métier
 * définitive.
 */
export const NAV_SECTION_ROLES: Record<NavSectionId, Role[]> = {
  dashboard: [...ROLES],
  pos: ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  kds: ["KITCHEN_STAFF", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  stock: ["STOCK_MANAGER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  cantine: ["CANTEEN_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  administration: ["ADMINISTRATION", "SYSTEM_ADMIN"],
  direction: ["DIRECTION", "FINANCE", "SYSTEM_ADMIN"],
  catalogue: ["ADMINISTRATION", "SYSTEM_ADMIN"],
  orders: ["CASHIER", "SNACK_MANAGER", "KITCHEN_STAFF", "ADMINISTRATION", "SYSTEM_ADMIN"],
  students: ["ADMINISTRATION", "SYSTEM_ADMIN"],
};

export function canAccessSection(role: Role, section: NavSectionId): boolean {
  return NAV_SECTION_ROLES[section].includes(role);
}
