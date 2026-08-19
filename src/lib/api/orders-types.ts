import type { Role } from "@/lib/roles";

export type OrderStatus =
  | "DRAFT"
  | "CREATED"
  | "AWAITING_PAYMENT"
  | "PAID"
  | "QUEUED"
  | "PREPARING"
  | "READY"
  | "COLLECTED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED"
  | "NO_SHOW";

export type OrderItem = {
  productName: string;
  quantity: number;
  priceCents: number;
};

export type Order = {
  id: string;
  code: string;
  status: OrderStatus;
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
  channel: "POS" | "MOBILE";
};

/**
 * Transitions valides de la state machine des commandes — proposition
 * frontend à confirmer avec le Dev Backend / STATE_MACHINES.md officiel
 * s'il existe. Ne jamais permettre côté UI une transition absente d'ici,
 * même pour "forcer" un raccourci (cf. CLAUDE_PROJECT.md, règle absolue).
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["CREATED", "CANCELLED"],
  CREATED: ["AWAITING_PAYMENT", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "EXPIRED", "CANCELLED"],
  PAID: ["QUEUED", "REFUNDED"],
  QUEUED: ["PREPARING", "NO_SHOW"],
  PREPARING: ["READY", "NO_SHOW"],
  READY: ["COLLECTED"],
  COLLECTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
  EXPIRED: [],
  REFUNDED: [],
  NO_SHOW: [],
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Brouillon",
  CREATED: "Créée",
  AWAITING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  QUEUED: "En file",
  PREPARING: "En préparation",
  READY: "Prête",
  COLLECTED: "Récupérée",
  COMPLETED: "Terminée",
  CANCELLED: "Annulée",
  EXPIRED: "Expirée",
  REFUNDED: "Remboursée",
  NO_SHOW: "Non récupérée",
};

/** Classes littérales complètes — voir commentaire en tête de fichier. */
export const ORDER_STATUS_COLOR_CLASS: Record<OrderStatus, string> = {
  DRAFT: "bg-status-queued",
  CREATED: "bg-status-queued",
  AWAITING_PAYMENT: "bg-status-queued",
  PAID: "bg-status-queued",
  QUEUED: "bg-status-queued",
  PREPARING: "bg-status-preparing",
  READY: "bg-status-ready",
  COLLECTED: "bg-status-ready",
  COMPLETED: "bg-status-ready",
  CANCELLED: "bg-status-alert",
  EXPIRED: "bg-status-alert",
  REFUNDED: "bg-status-alert",
  NO_SHOW: "bg-status-alert",
};

type OrderTransitionKey = `${OrderStatus}->${OrderStatus}`;

/**
 * Rôles autorisés à déclencher chaque transition depuis l'UI — proposition
 * frontend à valider avec la permissions matrix officielle du Dev Backend.
 * Une transition valide dans ORDER_TRANSITIONS mais absente d'ici n'a
 * simplement aucun bouton associé (ex. AWAITING_PAYMENT→PAID, déclenchée
 * par le paiement, pas par un clic staff).
 */
const ORDER_TRANSITION_ROLES: Partial<Record<OrderTransitionKey, Role[]>> = {
  "DRAFT->CANCELLED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "CREATED->CANCELLED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "AWAITING_PAYMENT->CANCELLED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "PAID->QUEUED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "PAID->REFUNDED": ["CASHIER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "QUEUED->PREPARING": ["KITCHEN_STAFF", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "QUEUED->NO_SHOW": ["KITCHEN_STAFF", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "PREPARING->READY": ["KITCHEN_STAFF", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "PREPARING->NO_SHOW": ["KITCHEN_STAFF", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "READY->COLLECTED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
  "COLLECTED->COMPLETED": ["CASHIER", "SNACK_MANAGER", "ADMINISTRATION", "SYSTEM_ADMIN"],
};

export function getAllowedRolesForTransition(from: OrderStatus, to: OrderStatus): Role[] {
  return ORDER_TRANSITION_ROLES[`${from}->${to}`] ?? [];
}
