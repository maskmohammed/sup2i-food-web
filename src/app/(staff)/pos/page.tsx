"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { CloseSessionPanel } from "./close-session-panel";
import { getErrorMessage } from "@/lib/error-messages";
import { MockPrinterAdapter, type PrintableTicket } from "@/lib/hardware/printer";
import { useKeyboardWedgeScanner } from "@/lib/hardware/scanner";
import type { ApiError } from "@/lib/api/types";
import type { Product } from "@/lib/api/catalogue-types";
import type {
  CartPriceResult,
  CashSession,
  CashSessionClosure,
  CreatedOrder,
  PaymentMethod,
} from "@/lib/api/pos-types";

type CartLine = { productId: string; quantity: number };
type PricingStatus = "idle" | "loading" | "success" | "error";
type ClosureRecap = {
  closure: CashSessionClosure;
  openingCashCents: number;
  cardSalesCents: number | null;
};

const DEBOUNCE_MS = 300;

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Espèces",
  CARD: "TPE",
};

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

function parsePriceToCents(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

export default function PosPage() {
  const {
    status: sessionStatus,
    data: session,
    error: sessionError,
    refetch: refetchSession,
  } = useApiQuery<CashSession | null>("/api/v1/pos/session/current");

  const [previousSessionClosed, setPreviousSessionClosed] = useState(false);
  const [closureRecap, setClosureRecap] = useState<ClosureRecap | null>(null);

  if (sessionStatus === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingState label="Vérification de la session de caisse..." />
      </div>
    );
  }

  if (sessionStatus === "error" && sessionError) {
    return (
      <ErrorState code={sessionError.code} traceId={sessionError.traceId}>
        <button
          type="button"
          onClick={refetchSession}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
        >
          Réessayer
        </button>
      </ErrorState>
    );
  }

  if (closureRecap) {
    return (
      <SessionClosedRecap
        recap={closureRecap}
        onContinue={() => {
          setClosureRecap(null);
          setPreviousSessionClosed(true);
          refetchSession();
        }}
      />
    );
  }

  if (!session) {
    return (
      <OpenSessionScreen
        previousSessionClosed={previousSessionClosed}
        onOpened={() => {
          setPreviousSessionClosed(false);
          refetchSession();
        }}
      />
    );
  }

  return <PosWorkspace session={session} onSessionClosed={setClosureRecap} />;
}

function OpenSessionScreen({
  previousSessionClosed,
  onOpened,
}: {
  previousSessionClosed: boolean;
  onOpened: () => void;
}) {
  const [openingCashInput, setOpeningCashInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await apiFetch<CashSession>("/api/v1/pos/session/open", {
      method: "POST",
      body: JSON.stringify({ openingCashCents: parsePriceToCents(openingCashInput) }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setOpeningCashInput("");
    onOpened();
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-lg font-semibold text-text">
          {previousSessionClosed ? "Session précédente clôturée" : "Ouvrir une session de caisse"}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {previousSessionClosed
            ? "Ouvrez une nouvelle session pour continuer."
            : "Une session de caisse doit être ouverte avant de pouvoir vendre."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="opening-cash" className="text-sm text-text-muted">
              Fond de caisse initial (DH)
            </label>
            <input
              id="opening-cash"
              type="number"
              min="0"
              step="0.01"
              required
              value={openingCashInput}
              onChange={(event) => setOpeningCashInput(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
            />
          </div>

          {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Ouverture..." : "Ouvrir la session"}
          </button>
        </form>
      </div>
    </div>
  );
}

function SessionClosedRecap({ recap, onContinue }: { recap: ClosureRecap; onContinue: () => void }) {
  const cashSalesCents = recap.closure.expectedCashCents - recap.openingCashCents;
  const differenceLabel =
    (recap.closure.differenceCents > 0 ? "+" : "") + formatPrice(recap.closure.differenceCents);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-lg font-semibold text-text">Session clôturée</h1>

        <dl className="mt-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Fond initial</dt>
            <dd className="font-mono text-text">{formatPrice(recap.openingCashCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Ventes espèces</dt>
            <dd className="font-mono text-text">{formatPrice(cashSalesCents)}</dd>
          </div>
          {recap.cardSalesCents !== null ? (
            <div className="flex justify-between">
              <dt className="text-text-muted">Ventes TPE</dt>
              <dd className="font-mono text-text">{formatPrice(recap.cardSalesCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="text-text-muted">Attendu en caisse</dt>
            <dd className="font-mono text-text">{formatPrice(recap.closure.expectedCashCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Déclaré</dt>
            <dd className="font-mono text-text">{formatPrice(recap.closure.declaredCashCents)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-1.5">
            <dt className="text-text-muted">Écart</dt>
            <dd
              className={`font-mono font-semibold ${
                recap.closure.differenceCents === 0 ? "text-text" : "text-status-alert-text"
              }`}
            >
              {differenceLabel}
            </dd>
          </div>
          {recap.closure.reasonCode ? (
            <div className="flex justify-between">
              <dt className="text-text-muted">Motif</dt>
              <dd className="text-text">{recap.closure.reasonCode}</dd>
            </div>
          ) : null}
        </dl>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Continuer
        </button>
      </div>
    </div>
  );
}

function TicketScreen({
  order,
  rushMode,
  onNewSale,
}: {
  order: CreatedOrder;
  rushMode: boolean;
  onNewSale: () => void;
}) {
  const [printStatus, setPrintStatus] = useState<"idle" | "printing" | "success" | "error">("idle");
  const [printError, setPrintError] = useState<ApiError | null>(null);

  async function handlePrint() {
    if (printStatus === "printing") return;

    setPrintStatus("printing");
    setPrintError(null);

    const ticket: PrintableTicket = {
      code: order.code,
      items: order.items.map(({ productName, quantity, subtotalCents }) => ({
        productName,
        quantity,
        subtotalCents,
      })),
      totalCents: order.totalCents,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
    };

    const result = await MockPrinterAdapter.print(ticket);

    if (result.ok) {
      setPrintStatus("success");
    } else {
      setPrintStatus("error");
      setPrintError(result.error);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-text-muted">Ticket</p>
        <h1 className="mt-1 text-center font-mono text-lg font-semibold text-text">{order.code}</h1>
        <p className="mt-1 text-center text-xs text-text-muted">
          {new Date(order.paidAt).toLocaleString("fr-FR")}
        </p>

        <ul className="mt-4 flex flex-col divide-y divide-border border-y border-border">
          {order.items.map((item) => (
            <li key={item.productId} className="flex items-center justify-between py-2 text-sm">
              <span className="text-text">
                {item.quantity} × {item.productName}
              </span>
              <span className="font-mono text-text-muted">{formatPrice(item.subtotalCents)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-text">Total</span>
          <span className="font-mono text-lg font-semibold text-text">{formatPrice(order.totalCents)}</span>
        </div>
        <p className="mt-1 text-right text-xs text-text-muted">
          Payé par {PAYMENT_METHOD_LABELS[order.paymentMethod]}
        </p>

        <button
          type="button"
          onClick={handlePrint}
          disabled={printStatus === "printing"}
          className="mt-6 w-full rounded-md border border-border bg-surface px-4 py-2 text-sm text-text transition-colors hover:bg-surface-raised disabled:opacity-50"
        >
          {printStatus === "printing" ? "Impression..." : "Imprimer le ticket"}
        </button>

        {printStatus === "error" && printError ? (
          <p className="mt-2 text-center text-xs text-status-alert-text">
            {getErrorMessage(printError.code)} — le paiement reste validé.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onNewSale}
          className="mt-2 w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {rushMode ? "Suivant" : "Nouvelle vente"}
        </button>
      </div>
    </div>
  );
}

function PosWorkspace({
  session,
  onSessionClosed,
}: {
  session: CashSession;
  onSessionClosed: (recap: ClosureRecap) => void;
}) {
  const {
    status: productsStatus,
    data: products,
    error: productsError,
    refetch: refetchProducts,
  } = useApiQuery<Product[]>("/api/v1/products");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [pricing, setPricing] = useState<CartPriceResult | null>(null);
  const [pricingStatus, setPricingStatus] = useState<PricingStatus>("idle");
  const [pricingError, setPricingError] = useState<ApiError | null>(null);

  const [rushMode, setRushMode] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<ApiError | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  // Une clé par tentative de paiement, renvoyée à l'identique sur un
  // retry (le mock déduplique) pour ne jamais créer deux commandes si la
  // réponse d'un premier essai s'est perdue après un succès serveur.
  // Réinitialisée quand le panier change (nouvelle tentative logique) ou
  // après un paiement réussi.
  const idempotencyKeyRef = useRef<string | null>(null);

  const [closePanelOpen, setClosePanelOpen] = useState(false);

  function applyCartChange(next: CartLine[]) {
    setCart(next);
    idempotencyKeyRef.current = null;
    if (next.length === 0) {
      setPricing(null);
      setPricingError(null);
      setPricingStatus("idle");
    } else {
      setPricingStatus("loading");
    }
  }

  function addToCart(productId: string) {
    const existing = cart.find((line) => line.productId === productId);
    const next = existing
      ? cart.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line))
      : [...cart, { productId, quantity: 1 }];
    applyCartChange(next);
  }

  function incrementQuantity(productId: string) {
    applyCartChange(
      cart.map((line) => (line.productId === productId ? { ...line, quantity: line.quantity + 1 } : line)),
    );
  }

  function decrementQuantity(productId: string) {
    const next = cart
      .map((line) => (line.productId === productId ? { ...line, quantity: line.quantity - 1 } : line))
      .filter((line) => line.quantity > 0);
    applyCartChange(next);
  }

  function clearCart() {
    applyCartChange([]);
    setCheckoutOpen(false);
    setPaymentMethod(null);
    setCheckoutError(null);
  }

  function toggleRushMode() {
    setRushMode((prev) => !prev);
    setCheckoutOpen(false);
    setPaymentMethod(null);
    setCheckoutError(null);
  }

  // Referme le TODO ouvert depuis W7 : le scanner keyboard-wedge était prêt
  // mais jamais branché, faute de champ barcode sur Product (ajouté en
  // W11). Un scan qui matche un produit disponible l'ajoute au panier,
  // exactement comme un clic sur la grille.
  //
  // `productsRef`/`addToCartRef` + `handleScan` stable (useCallback, deps
  // vides) : le hook ne se réabonne qu'une fois au montage. Si on lui
  // passait une fonction recréée à chaque render (ex. panier qui change),
  // le listener clavier serait désabonné/réabonné en plein milieu d'une
  // rafale de frappes rapides, ce qui viderait le buffer interne du
  // scanner et perdrait le scan en cours (voir src/lib/hardware/scanner.ts).
  const productsRef = useRef(products);
  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  const addToCartRef = useRef(addToCart);
  useEffect(() => {
    addToCartRef.current = addToCart;
  });

  const handleScan = useCallback((code: string) => {
    const product = productsRef.current?.find((candidate) => candidate.barcode === code);
    if (product && product.available) {
      addToCartRef.current(product.id);
    }
  }, []);

  useKeyboardWedgeScanner(handleScan);

  useEffect(() => {
    if (cart.length === 0) return;

    const timeoutId = setTimeout(() => {
      apiFetch<CartPriceResult>("/api/v1/pos/cart/price", {
        method: "POST",
        body: JSON.stringify({ items: cart }),
      }).then((result) => {
        if (result.ok) {
          setPricing(result.data);
          setPricingError(null);
          setPricingStatus("success");
          return;
        }

        setPricingError(result.error);
        setPricingStatus("error");

        if (result.error.code === "OUT_OF_STOCK" && products) {
          const unavailableIds = new Set(
            cart
              .filter((line) => {
                const product = products.find((candidate) => candidate.id === line.productId);
                return !product || !product.available;
              })
              .map((line) => line.productId),
          );
          if (unavailableIds.size > 0) {
            setCart((prev) => prev.filter((line) => !unavailableIds.has(line.productId)));
          }
        }
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [cart, products]);

  function startCheckout() {
    if (cart.length === 0 || checkoutSubmitting) return;
    setCheckoutOpen(true);
    setCheckoutError(null);
  }

  function cancelCheckout() {
    if (checkoutSubmitting) return;
    setCheckoutOpen(false);
    setPaymentMethod(null);
    setCheckoutError(null);
  }

  async function submitPayment(method: PaymentMethod) {
    if (checkoutSubmitting) return;

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    setCheckoutSubmitting(true);
    setCheckoutError(null);

    const result = await apiFetch<CreatedOrder>("/api/v1/pos/orders", {
      method: "POST",
      body: JSON.stringify({ items: cart, paymentMethod: method, idempotencyKey: idempotencyKeyRef.current }),
    });

    setCheckoutSubmitting(false);

    if (!result.ok) {
      setCheckoutError(result.error);
      // La clé reste inchangée : un "Confirmer"/retry renverra la même
      // valeur, permettant au mock de dédupliquer si la commande avait en
      // fait réussi côté serveur avant que la réponse ne se perde.
      return;
    }

    idempotencyKeyRef.current = null;
    setCreatedOrder(result.data);
    setCheckoutOpen(false);
    setPaymentMethod(null);
    applyCartChange([]);
  }

  if (createdOrder) {
    return <TicketScreen order={createdOrder} rushMode={rushMode} onNewSale={() => setCreatedOrder(null)} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">POS</h1>
          <p className="mt-1 text-sm text-text-muted">Sélectionnez des produits pour composer la commande.</p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <p className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs text-text-muted">
            Session ouverte — fond initial {formatPrice(session.openingCashCents)}
          </p>
          <button
            type="button"
            onClick={toggleRushMode}
            disabled={checkoutSubmitting}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
              rushMode
                ? "border-accent-warm bg-accent-warm/10 text-accent-warm-text"
                : "border-border bg-surface-raised text-text-muted hover:text-text"
            }`}
          >
            Mode Rush {rushMode ? "activé" : "désactivé"}
          </button>
          <button
            type="button"
            onClick={() => setClosePanelOpen(true)}
            className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs text-text-muted transition-colors hover:text-text"
          >
            Clôturer la session
          </button>
        </div>
      </div>

      <div className="mt-6 flex gap-6">
        <div className="min-w-0 flex-1">
          {productsStatus === "loading" ? <LoadingState label="Chargement des produits..." /> : null}

          {productsStatus === "error" && productsError ? (
            <ErrorState code={productsError.code} traceId={productsError.traceId}>
              <button
                type="button"
                onClick={refetchProducts}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
              >
                Réessayer
              </button>
            </ErrorState>
          ) : null}

          {productsStatus === "success" && products ? (
            <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={!product.available}
                  onClick={() => addToCart(product.id)}
                  className="flex min-h-24 min-w-0 flex-col items-start justify-center gap-1 rounded-lg border border-border bg-surface-raised p-4 text-left transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="w-full break-words text-base font-semibold leading-snug text-text">
                    {product.name}
                  </span>
                  <span className="font-mono text-sm text-text-muted">{formatPrice(product.priceCents)}</span>
                  {!product.available ? (
                    <span className="text-xs text-status-alert-text">Indisponible</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="w-80 flex-none rounded-lg border border-border bg-surface-raised p-4">
          <h2 className="text-sm font-semibold text-text">Panier</h2>

          {cart.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Panier vide" description="Sélectionnez des produits dans la grille." />
            </div>
          ) : (
            <>
              <ul className="mt-4 flex flex-col divide-y divide-border">
                {cart.map((line) => {
                  const product = products?.find((candidate) => candidate.id === line.productId);
                  return (
                    <li key={line.productId} className="flex items-center justify-between gap-2 py-2">
                      <p className="min-w-0 truncate text-sm text-text">{product?.name ?? line.productId}</p>
                      <div className="flex flex-none items-center gap-2">
                        <button
                          type="button"
                          onClick={() => decrementQuantity(line.productId)}
                          aria-label="Diminuer la quantité"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text transition-colors hover:bg-surface-raised"
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-mono text-sm text-text">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => incrementQuantity(line.productId)}
                          aria-label="Augmenter la quantité"
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-text transition-colors hover:bg-surface-raised"
                        >
                          +
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {pricingStatus === "loading" ? (
                <div className="mt-3">
                  <LoadingState label="Calcul du total..." />
                </div>
              ) : null}

              {pricingStatus === "error" && pricingError ? (
                <div className="mt-3">
                  <ErrorState code={pricingError.code} traceId={pricingError.traceId} />
                </div>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium text-text">Total</span>
                <span className="font-mono text-lg font-semibold text-text">
                  {pricing ? formatPrice(pricing.totalCents) : "—"}
                </span>
              </div>

              <button
                type="button"
                onClick={clearCart}
                className="mt-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:bg-surface-raised hover:text-text"
              >
                Vider le panier
              </button>

              {rushMode ? (
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => submitPayment("CASH")}
                    disabled={checkoutSubmitting}
                    className="w-full rounded-md bg-brand px-3 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutSubmitting ? "Encaissement..." : "Payer — Espèces"}
                  </button>
                  <button
                    type="button"
                    onClick={() => submitPayment("CARD")}
                    disabled={checkoutSubmitting}
                    className="w-full rounded-md bg-brand px-3 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutSubmitting ? "Encaissement..." : "Payer — TPE"}
                  </button>
                  {checkoutError ? (
                    <ErrorState code={checkoutError.code} traceId={checkoutError.traceId} />
                  ) : null}
                </div>
              ) : !checkoutOpen ? (
                <button
                  type="button"
                  onClick={startCheckout}
                  disabled={cart.length === 0}
                  className="mt-2 w-full rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Payer
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
                  <p className="text-sm font-medium text-text">Mode de paiement</p>
                  <div className="flex gap-2">
                    {(["CASH", "CARD"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        disabled={checkoutSubmitting}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                          paymentMethod === method
                            ? "border-brand bg-brand/10 text-text"
                            : "border-border bg-surface-raised text-text-muted hover:text-text"
                        }`}
                      >
                        {PAYMENT_METHOD_LABELS[method]}
                      </button>
                    ))}
                  </div>

                  {checkoutError ? <ErrorState code={checkoutError.code} traceId={checkoutError.traceId} /> : null}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelCheckout}
                      disabled={checkoutSubmitting}
                      className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted transition-colors hover:text-text disabled:opacity-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => paymentMethod && submitPayment(paymentMethod)}
                      disabled={!paymentMethod || checkoutSubmitting}
                      className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {checkoutSubmitting ? "Encaissement..." : "Confirmer le paiement"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </aside>
      </div>

      {closePanelOpen ? (
        <CloseSessionPanel
          session={session}
          onCancel={() => setClosePanelOpen(false)}
          onClosed={(closure, summary) => {
            setClosePanelOpen(false);
            onSessionClosed({
              closure,
              openingCashCents: session.openingCashCents,
              cardSalesCents: summary?.cardSalesCents ?? null,
            });
          }}
        />
      ) : null}
    </div>
  );
}
