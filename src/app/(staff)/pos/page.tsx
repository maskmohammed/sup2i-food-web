"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { ApiError } from "@/lib/api/types";
import type { Product } from "@/lib/api/catalogue-types";
import type { CartPriceResult } from "@/lib/api/pos-types";

type CartLine = { productId: string; quantity: number };
type PricingStatus = "idle" | "loading" | "success" | "error";

const DEBOUNCE_MS = 300;

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

export default function PosPage() {
  const { status: productsStatus, data: products, error: productsError, refetch: refetchProducts } =
    useApiQuery<Product[]>("/api/v1/products");

  const [cart, setCart] = useState<CartLine[]>([]);
  const [pricing, setPricing] = useState<CartPriceResult | null>(null);
  const [pricingStatus, setPricingStatus] = useState<PricingStatus>("idle");
  const [pricingError, setPricingError] = useState<ApiError | null>(null);

  function applyCartChange(next: CartLine[]) {
    setCart(next);
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
  }

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

  return (
    <div className="flex gap-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg font-semibold text-text">POS</h1>
        <p className="mt-1 text-sm text-text-muted">Sélectionnez des produits pour composer la commande.</p>

        <div className="mt-6">
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
                    <span className="text-xs text-status-alert">Indisponible</span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
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

            <button
              type="button"
              disabled
              title="Paiement — prochaine étape"
              className="mt-2 w-full cursor-not-allowed rounded-md bg-brand px-3 py-2 text-sm font-medium text-white opacity-50"
            >
              Payer — prochaine étape
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
