"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/states/error-state";
import { useAuth } from "@/lib/auth/auth-context";
import type { ApiError } from "@/lib/api/types";

function Icon({ children, className = "h-4 w-4" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

function UserIcon() {
  return (
    <Icon>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20v-1a8 8 0 0 1 16 0v1" />
    </Icon>
  );
}

function LockIcon() {
  return (
    <Icon>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  );
}

function EyeIcon() {
  return (
    <Icon>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  );
}

function EyeOffIcon() {
  return (
    <Icon>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.5 6.6C3.6 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.2-.9" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </Icon>
  );
}

function ArrowRightIcon() {
  return (
    <Icon>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </Icon>
  );
}

function ShieldCheckIcon() {
  return (
    <Icon className="h-3.5 w-3.5">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6Z" />
      <path d="M9.5 12l1.8 1.8L14.5 10" />
    </Icon>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/*
         * Panneau branding — visible à partir de lg uniquement. Le visuel
         * (bâtiment SUP2I + ruban navy/magenta) vient du fichier fourni
         * public/login-sup.png, utilisé tel quel (object-contain : jamais
         * recadré/déformé) — pas de décor CSS fabriqué à sa place. Le
         * pictogramme vient de public/logo-sup2i.png.
         */}
        <div className="relative hidden overflow-hidden bg-bg lg:flex lg:w-[40%] lg:flex-none lg:flex-col">
          <div className="relative z-10 flex flex-1 flex-col px-12 py-10">
            <div className="inline-flex w-fit rounded-2xl bg-white p-3 shadow-sm">
              {/* Le fichier logo a un fond blanc opaque (pas de transparence) :
                  on l'encadre dans une carte blanche plutôt que de le poser
                  directement sur le fond (visible/disgracieux en thème sombre). */}
              <Image src="/logo-sup2i.png" alt="SUP2I" width={64} height={64} priority />
            </div>

            <div className="mt-8 max-w-md">
              <h2 className="text-3xl font-bold leading-tight text-text">
                Bienvenue sur
                <br />
                <span className="text-text">SUP2I</span> <span className="text-brand">Food</span>
              </h2>
              <p className="mt-4 text-sm text-text-muted">
                La plateforme de gestion de la buvette pour le staff.
              </p>
              <div className="mt-5 h-1 w-12 rounded-full bg-brand" />
            </div>

            {/*
             * aspect-[272/387] = ratio exact du fichier fourni : le
             * conteneur épouse la même proportion que l'image, donc
             * object-cover ne recadre ni ne déforme rien (aucune marge à
             * combler). Cadre arrondi + ombre pour que le fond clair de la
             * photo se lise comme une carte photo intentionnelle plutôt
             * qu'un bord brut, notamment en thème sombre.
             *
             * Pas de max-w fixe (ex. 300px) : la photo doit occuper la
             * majorité du panneau 40% (demande produit explicite), donc elle
             * suit la largeur réelle de la colonne — bornée uniquement par le
             * px-12 du parent, jamais par une valeur en dur qui casserait le
             * ratio photo/colonne sur un écran large (voir capture 1440px
             * avant correction : la colonne gauche restait très étroite).
             */}
            <div className="relative mt-6 w-full max-w-md overflow-hidden rounded-2xl shadow-lg">
              <div className="relative aspect-[272/387] w-full">
                <Image
                  src="/login-sup.png"
                  alt="Campus SUP2I"
                  fill
                  priority
                  sizes="(min-width: 1024px) 40vw, 0px"
                  className="object-cover"
                />
              </div>
            </div>

            <p className="relative flex items-center gap-2 pt-4 text-xs text-text-muted">
              <ShieldCheckIcon />
              Accès sécurisé réservé au personnel
            </p>
          </div>
        </div>

        {/* En-tête compact mobile/tablette — branding simplifié, pas de décor. */}
        <div className="flex items-center justify-center gap-3 px-6 pb-2 pt-10 lg:hidden">
          <div className="flex-none rounded-lg bg-white p-1.5 shadow-sm">
            <Image src="/logo-sup2i.png" alt="SUP2I" width={28} height={28} priority />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-brand">SUP2I Food</p>
            <p className="text-xs text-text-muted">Espace staff</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 lg:px-12 lg:py-12">
          {/* max-w-md (448px) laissait un vide énorme dans une colonne à 60%
              de large (jusqu'à ~860px sur un écran 1440px) — la carte doit
              rester une carte (jamais pleine largeur), mais assez large pour
              occuper visiblement la section droite, voir capture avant
              correction. */}
          <div className="w-full max-w-xl rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/5 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-raised">
                <Image src="/logo-sup2i.png" alt="SUP2I" width={52} height={52} priority />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand">SUP2I Food</p>
              <h1 className="mt-1 text-2xl font-bold text-text">Connexion staff</h1>
              <p className="mt-2 text-sm text-text-muted">
                Veuillez saisir vos identifiants pour accéder à votre espace personnel.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="username" className="text-sm font-medium text-text">
                  Identifiant
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <UserIcon />
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    placeholder="Votre identifiant"
                    value={identifiant}
                    onChange={(event) => setIdentifiant(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-3 text-sm text-text outline-none transition-colors focus:border-brand"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium text-text">
                  Mot de passe
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <LockIcon />
                  </span>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Votre mot de passe"
                    value={motDePasse}
                    onChange={(event) => setMotDePasse(event.target.value)}
                    className="w-full rounded-lg border border-border bg-surface-raised py-2.5 pl-10 pr-10 text-sm text-text outline-none transition-colors focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <label className="flex items-center gap-2 text-text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 rounded border-border text-brand focus:ring-brand"
                  />
                  Se souvenir de moi
                </label>
                {/*
                 * Pas de flux "mot de passe oublié" côté backend pour
                 * l'instant (auth 100% mock) : bouton volontairement inerte
                 * plutôt qu'un lien mort, en attente d'un vrai endpoint.
                 */}
                <button type="button" className="font-medium text-brand transition-opacity hover:opacity-80">
                  Mot de passe oublié ?
                </button>
              </div>

              {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span
                      aria-hidden
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                    Connexion...
                  </>
                ) : (
                  <>
                    <ArrowRightIcon />
                    Se connecter
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
              <div className="h-px flex-1 bg-border" />
              <span className="flex flex-none items-center gap-1.5 whitespace-nowrap">
                <ShieldCheckIcon />
                Accès réservé au personnel SUP2I
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>
        </div>
      </div>

      <p className="pb-6 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} <span className="text-brand">SUP2I</span> Food. Tous droits réservés.
      </p>
    </div>
  );
}
