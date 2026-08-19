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
