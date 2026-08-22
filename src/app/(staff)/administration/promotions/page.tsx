"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { RequireRole } from "@/components/require-role";
import { NAV_SECTION_ROLES } from "@/lib/roles";
import type { ApiError } from "@/lib/api/types";
import type { Product, Promotion } from "@/lib/api/catalogue-types";

export default function PromotionsPage() {
  const {
    status: promoStatus,
    data: promotions,
    error: promoError,
    refetch: refetchPromotions,
  } = useApiQuery<Promotion[]>("/api/v1/promotions");
  const { data: products } = useApiQuery<Product[]>("/api/v1/products");

  const [label, setLabel] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | null>(null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<ApiError | null>(null);

  function toggleProductSelection(productId: string) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setCreateError(null);

    const result = await apiFetch<Promotion>("/api/v1/promotions", {
      method: "POST",
      body: JSON.stringify({
        label,
        discountPercent: Number(discountInput),
        appliesToProductIds: selectedProductIds,
      }),
    });

    setCreating(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setLabel("");
    setDiscountInput("");
    setSelectedProductIds([]);
    refetchPromotions();
  }

  async function handleToggleActive(promotion: Promotion) {
    if (pendingId) return;

    setPendingId(promotion.id);
    setToggleError(null);

    const result = await apiFetch<Promotion>(`/api/v1/promotions/${promotion.id}/active`, {
      method: "PATCH",
      body: JSON.stringify({ active: !promotion.active }),
    });

    setPendingId(null);

    if (!result.ok) {
      setToggleError(result.error);
      return;
    }

    refetchPromotions();
  }

  function productName(productId: string): string {
    return products?.find((product) => product.id === productId)?.name ?? productId;
  }

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.promotions}>
      <div>
        <h1 className="text-lg font-semibold text-text">Promotions</h1>
        <p className="mt-1 text-sm text-text-muted">
          Réductions appliquées automatiquement au calcul du total serveur — données mockées.
        </p>

        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4"
        >
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="promo-label" className="text-sm text-text-muted">
                Libellé
              </label>
              <input
                id="promo-label"
                type="text"
                required
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="promo-discount" className="text-sm text-text-muted">
                Réduction (%)
              </label>
              <input
                id="promo-discount"
                type="number"
                min="1"
                max="100"
                required
                value={discountInput}
                onChange={(event) => setDiscountInput(event.target.value)}
                className="w-24 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-sm text-text-muted">Produits concernés</p>
            <div className="flex flex-wrap gap-3">
              {(products ?? []).map((product) => (
                <label key={product.id} className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(product.id)}
                    onChange={() => toggleProductSelection(product.id)}
                  />
                  {product.name}
                </label>
              ))}
            </div>
          </div>

          {createError ? <ErrorState code={createError.code} traceId={createError.traceId} /> : null}

          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Création..." : "Créer la promotion"}
          </button>
        </form>

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-text">Promotions actives</h2>

          {promoStatus === "loading" ? <LoadingState label="Chargement des promotions..." /> : null}

          {promoStatus === "error" && promoError ? (
            <ErrorState code={promoError.code} traceId={promoError.traceId}>
              <button
                type="button"
                onClick={refetchPromotions}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
              >
                Réessayer
              </button>
            </ErrorState>
          ) : null}

          {promoStatus === "success" && promotions ? (
            promotions.length === 0 ? (
              <EmptyState
                title="Aucune promotion"
                description="Créez une première promotion avec le formulaire ci-dessus."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {promotions.map((promotion) => (
                  <li
                    key={promotion.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-raised p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {promotion.label} — {promotion.discountPercent}%
                      </p>
                      <p className="truncate text-xs text-text-muted">
                        {promotion.appliesToProductIds.map(productName).join(", ")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(promotion)}
                      disabled={pendingId === promotion.id}
                      className={`flex-none whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
                        promotion.active
                          ? "border-status-ready text-status-ready"
                          : "border-border text-text-muted"
                      }`}
                    >
                      {pendingId === promotion.id ? "..." : promotion.active ? "Active" : "Inactive"}
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        {toggleError ? (
          <div className="mt-4">
            <ErrorState code={toggleError.code} traceId={toggleError.traceId} />
          </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
