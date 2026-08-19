"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { ErrorState } from "@/components/states/error-state";
import type { ApiError } from "@/lib/api/types";
import type { CashSession, CashSessionClosure, CashSessionSummary } from "@/lib/api/pos-types";

function formatPrice(priceCents: number): string {
  return `${(priceCents / 100).toFixed(2)} DH`;
}

function parsePriceToCents(value: string): number {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : NaN;
}

export function CloseSessionPanel({
  session,
  onCancel,
  onClosed,
}: {
  session: CashSession;
  onCancel: () => void;
  onClosed: (closure: CashSessionClosure, summary: CashSessionSummary | null) => void;
}) {
  const [summary, setSummary] = useState<CashSessionSummary | null>(null);
  const [summaryError, setSummaryError] = useState<ApiError | null>(null);

  const [declaredInput, setDeclaredInput] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    apiFetch<CashSessionSummary>("/api/v1/pos/session/summary").then((result) => {
      if (result.ok) {
        setSummary(result.data);
      } else {
        setSummaryError(result.error);
      }
    });
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await apiFetch<CashSessionClosure>("/api/v1/pos/session/close", {
      method: "POST",
      body: JSON.stringify({
        declaredCashCents: parsePriceToCents(declaredInput),
        reasonCode: reason.trim() || undefined,
      }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onClosed(result.data, summary);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface-raised p-6">
        <h2 className="text-lg font-semibold text-text">Clôturer la session</h2>
        <p className="mt-1 text-sm text-text-muted">Fond initial {formatPrice(session.openingCashCents)}</p>

        {summaryError ? (
          <div className="mt-3">
            <ErrorState code={summaryError.code} traceId={summaryError.traceId} />
          </div>
        ) : summary ? (
          <dl className="mt-3 flex flex-col gap-1 rounded-md border border-border bg-surface p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-muted">Ventes espèces</dt>
              <dd className="font-mono text-text">{formatPrice(summary.cashSalesCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-muted">Ventes TPE</dt>
              <dd className="font-mono text-text">{formatPrice(summary.cardSalesCents)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="text-text-muted">Attendu en caisse</dt>
              <dd className="font-mono font-semibold text-text">{formatPrice(summary.expectedCashCents)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-text-muted">Calcul du montant attendu...</p>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="declared-cash" className="text-sm text-text-muted">
              Montant en caisse déclaré (DH)
            </label>
            <input
              id="declared-cash"
              type="number"
              min="0"
              step="0.01"
              required
              value={declaredInput}
              onChange={(event) => setDeclaredInput(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="close-reason" className="text-sm text-text-muted">
              Motif de l&apos;écart (si applicable)
            </label>
            <input
              id="close-reason"
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Requis uniquement si le montant déclaré diffère du montant attendu"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:text-text disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Clôture..." : "Clôturer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
