export type Product = {
  id: string;
  name: string;
  /** Toujours en centimes — jamais de float. Formaté en DH uniquement à l'affichage. */
  priceCents: number;
  category: string;
  available: boolean;
};

export type CreateProductInput = {
  name: string;
  priceCents: number;
  category: string;
};
