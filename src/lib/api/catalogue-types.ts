export type ProductOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
};

export type Product = {
  id: string;
  name: string;
  /** Toujours en centimes — jamais de float. Formaté en DH uniquement à l'affichage. */
  priceCents: number;
  category: string;
  available: boolean;
  barcode?: string;
  options?: ProductOption[];
};

export type CreateProductInput = {
  name: string;
  priceCents: number;
  category: string;
  barcode?: string;
};

export type Promotion = {
  id: string;
  label: string;
  discountPercent: number;
  active: boolean;
  appliesToProductIds: string[];
};
