export type StockItem = {
  id: string;
  productId: string;
  productName: string;
  quantityOnHand: number;
  unit: string;
  lowStockThreshold: number;
};

export type StockMovementType = "RECEIPT" | "SALE_DEDUCTION" | "ADJUSTMENT" | "WASTE";

export type StockMovement = {
  id: string;
  stockItemId: string;
  type: StockMovementType;
  quantityDelta: number;
  reason?: string;
  createdAt: string;
  createdBy: string;
};

export type WasteReason = "EXPIRED" | "DAMAGED" | "PREPARATION_ERROR" | "OTHER";

export const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  EXPIRED: "Périmé",
  DAMAGED: "Endommagé",
  PREPARATION_ERROR: "Erreur de préparation",
  OTHER: "Autre",
};
