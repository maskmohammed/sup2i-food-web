export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Session expirée, veuillez vous reconnecter.",
  PERMISSION_DENIED: "Vous n'avez pas les droits nécessaires pour cette action.",
  CONCURRENT_MODIFICATION: "Cet élément a été modifié entre-temps, veuillez recharger.",
  OUT_OF_STOCK: "Stock insuffisant pour ce produit.",
  INVALID_ORDER_STATUS: "Cette commande ne peut pas passer à cet état.",
  PAYMENT_ALREADY_COMPLETED: "Ce paiement a déjà été effectué.",
  PAYMENT_NOT_REFUNDABLE: "Ce paiement ne peut pas être remboursé.",
  INVALID_QR: "QR code invalide ou illisible.",
  FOOD_PASS_LOST: "Ce Food Pass a été déclaré perdu.",
  MEAL_ALREADY_USED: "Ce repas a déjà été utilisé aujourd'hui.",
  POS_SESSION_NOT_OPEN: "Aucune session de caisse ouverte.",
  CASH_DIFFERENCE_REASON_REQUIRED: "Un motif est requis pour justifier l'écart de caisse.",
  RATE_LIMITED: "Trop de tentatives, veuillez patienter avant de réessayer.",
  INTERNAL_ERROR: "Une erreur inattendue est survenue côté serveur.",
  VALIDATION_ERROR: "Certaines informations saisies sont invalides — vérifiez le nom, le prix et la catégorie.",
  SESSION_ALREADY_OPEN: "Une session de caisse est déjà ouverte.",
  SUBSCRIPTION_INACTIVE: "Abonnement Food Pass inactif — distribution bloquée.",
};

export const DEFAULT_ERROR_MESSAGE = "Une erreur est survenue.";

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? DEFAULT_ERROR_MESSAGE;
}
