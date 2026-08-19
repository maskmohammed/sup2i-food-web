"use client";

import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api";
import { LoadingState } from "@/components/states/loading-state";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
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
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<ApiError | null>(null);

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
    refetch();
  }

  return (
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

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
                <li key={product.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-text">{product.name}</p>
                    <p className="text-xs text-text-muted">{product.category}</p>
                  </div>
                  <p className="font-mono text-sm text-text">{formatPrice(product.priceCents)}</p>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}
