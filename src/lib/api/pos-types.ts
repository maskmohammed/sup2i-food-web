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
