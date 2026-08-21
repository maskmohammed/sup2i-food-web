export type DirectionKpi = {
  totalRevenueCents: number;
  orderCount: number;
  averageOrderCents: number;
  ordersByChannel: { POS: number; MOBILE: number };
  /**
   * null : le mode de paiement (CASH/TPE) n'est retourné que
   * transitoirement à la création d'une commande POS (CreatedOrder,
   * voir pos-types.ts) — il n'est jamais persisté sur l'Order en
   * mémoire. Non calculable sans changer le modèle de données existant,
   * volontairement non inventé ici.
   */
  ordersByPaymentMethod: { CASH: number; CARD: number } | null;
  canteenMealsDistributedToday: number;
  stockWasteCount: number;
  /** Estimation basée sur le prix catalogue actuel — pas un chiffre comptable officiel. */
  stockWasteEstimatedValueCents: number;
  lowStockAlertsCount: number;
};
