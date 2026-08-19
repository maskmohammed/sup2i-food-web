import type { ApiResult } from "@/lib/api/types";
import type { PaymentMethod } from "@/lib/api/pos-types";

export type PrintableTicket = {
  code: string;
  items: { productName: string; quantity: number; subtotalCents: number }[];
  totalCents: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
};

export interface PrinterAdapter {
  print(ticket: PrintableTicket): Promise<ApiResult<void>>;
}

/**
 * Mock — aucune imprimante physique disponible pour l'instant. À
 * remplacer par une vraie intégration (impression navigateur classique en
 * attendant confirmation du matériel exact, ou driver spécifique selon ce
 * que révèle l'audit Cactus/matériel en W13). Un échec d'impression ne
 * doit jamais être traité comme un échec de paiement — voir l'appelant.
 */
export const MockPrinterAdapter: PrinterAdapter = {
  async print(ticket) {
    console.info("Impression simulée", ticket);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { ok: true, data: undefined };
  },
};
