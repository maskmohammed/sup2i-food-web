export type CartItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
};

export type CartPriceResult = {
  items: CartItem[];
  totalCents: number;
};

export type CashSession = {
  id: string;
  openedAt: string;
  openingCashCents: number;
  status: "OPEN" | "CLOSED";
};

export type PaymentMethod = "CASH" | "CARD";

export type CreatedOrder = {
  id: string;
  code: string;
  items: CartItem[];
  totalCents: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
};

export type CashSessionClosure = {
  sessionId: string;
  declaredCashCents: number;
  expectedCashCents: number;
  differenceCents: number;
  reasonCode?: string;
  closedAt: string;
};

/**
 * Pas demandé explicitement dans le cahier des charges initial, mais
 * nécessaire pour afficher le détail espèces/TPE avant clôture (le GET
 * séparé évoqué comme option) — CashSessionClosure, lui, reste conforme
 * à la forme spécifiée.
 */
export type CashSessionSummary = {
  sessionId: string;
  openingCashCents: number;
  cashSalesCents: number;
  cardSalesCents: number;
  expectedCashCents: number;
};
