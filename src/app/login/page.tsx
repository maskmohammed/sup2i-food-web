"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/states/error-state";
import { useAuth } from "@/lib/auth/auth-context";
import type { ApiError } from "@/lib/api/types";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await login(identifiant, motDePasse);

    if (result.ok) {
      router.push("/dashboard");
      return;
    }

    setError(result.error);
    setSubmitting(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8">
        <p className="text-center text-sm font-semibold tracking-tight text-brand">
          SUP2I Food
        </p>
        <h1 className="mt-1 text-center text-lg font-semibold text-text">
          Connexion staff
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-sm text-text-muted">
              Identifiant
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              value={identifiant}
              onChange={(event) => setIdentifiant(event.target.value)}
              className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm text-text-muted">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(event) => setMotDePasse(event.target.value)}
              className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
