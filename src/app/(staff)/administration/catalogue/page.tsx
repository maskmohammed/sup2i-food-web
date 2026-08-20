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
import type { Product } from "@/lib/api/catalogue-types";

const CATEGORIES = ["Boissons", "Snacks", "Plats"];

function parsePriceToCents(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

export default function CataloguePage() {
  const { status, data, error, refetch } = useApiQuery<Product[]>("/api/v1/products");

  const [name, setName] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [barcode, setBarcode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [expandedOptionsId, setExpandedOptionsId] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setFormError(null);

    const result = await apiFetch<Product>("/api/v1/products", {
      method: "POST",
      body: JSON.stringify({
        name,
        priceCents: parsePriceToCents(priceInput),
        category,
        barcode: barcode.trim() || undefined,
      }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setName("");
    setPriceInput("");
    setCategory(CATEGORIES[0]);
    setBarcode("");
    refetch();
  }

  async function handleToggleAvailability(product: Product) {
    if (pendingId) return;

    setPendingId(product.id);
    setActionError(null);

    const result = await apiFetch<Product>(`/api/v1/products/${product.id}/availability`, {
      method: "PATCH",
      body: JSON.stringify({ available: !product.available }),
    });

    setPendingId(null);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    refetch();
  }

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.catalogue}>
      <div>
        <h1 className="text-lg font-semibold text-text">Catalogue</h1>
        <p className="mt-1 text-sm text-text-muted">
          Produits disponibles à la vente — données mockées, pas encore persistées côté backend.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-name" className="text-sm text-text-muted">
              Nom
            </label>
            <input
              id="product-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-price" className="text-sm text-text-muted">
              Prix (DH)
            </label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              required
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              className="w-28 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-category" className="text-sm text-text-muted">
              Catégorie
            </label>
            <select
              id="product-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
            >
              {CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-barcode" className="text-sm text-text-muted">
              Code-barres (optionnel)
            </label>
            <input
              id="product-barcode"
              type="text"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Création..." : "Créer le produit"}
          </button>
        </form>

        {formError ? (
          <div className="mt-4">
            <ErrorState code={formError.code} traceId={formError.traceId} />
          </div>
        ) : null}

        <div className="mt-8">
          {status === "loading" ? <LoadingState label="Chargement du catalogue..." /> : null}

          {status === "error" && error ? (
            <ErrorState code={error.code} traceId={error.traceId}>
              <button
                type="button"
                onClick={refetch}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
              >
                Réessayer
              </button>
            </ErrorState>
          ) : null}

          {status === "success" && data ? (
            data.length === 0 ? (
              <EmptyState
                title="Aucun produit"
                description="Créez un premier produit avec le formulaire ci-dessus."
              />
            ) : (
              <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface-raised">
                {data.map((product) => (
                  <li key={product.id} className="flex flex-col gap-2 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text">{product.name}</p>
                        <p className="text-xs text-text-muted">{product.category}</p>
                        {product.barcode ? (
                          <p className="font-mono text-xs text-text-muted">{product.barcode}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-none items-center gap-2">
                        <p className="font-mono text-sm text-text">{formatPrice(product.priceCents)}</p>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(product)}
                          disabled={pendingId === product.id}
                          className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs transition-colors disabled:opacity-50 ${
                            product.available
                              ? "border-status-ready text-status-ready"
                              : "border-status-alert text-status-alert"
                          }`}
                        >
                          {pendingId === product.id
                            ? "..."
                            : product.available
                              ? "Disponible"
                              : "Indisponible"}
                        </button>
                        {product.options && product.options.length > 0 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedOptionsId((prev) => (prev === product.id ? null : product.id))
                            }
                            className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
                          >
                            Options
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {expandedOptionsId === product.id && product.options ? (
                      <ul className="ml-1 flex flex-col gap-1 rounded-md border border-border bg-surface p-3">
                        {product.options.map((option) => (
                          <li key={option.id} className="flex items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate text-text">{option.name}</span>
                            <span className="flex-none whitespace-nowrap font-mono text-text-muted">
                              {option.priceDeltaCents >= 0 ? "+" : ""}
                              {formatPrice(option.priceDeltaCents)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>

        {actionError ? (
          <div className="mt-4">
            <ErrorState code={actionError.code} traceId={actionError.traceId} />
          </div>
        ) : null}
      </div>
    </RequireRole>
  );
}
