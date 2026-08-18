"use client";

import type { FormEvent } from "react";

export default function LoginPage() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
              className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}
