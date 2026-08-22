"use client";

import { useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/api/client";
import { LoadingState } from "@/components/states/loading-state";
import { ErrorState } from "@/components/states/error-state";
import { MEAL_TYPE_LABELS } from "@/lib/api/canteen-types";
import type { FoodPassLookupResult, MealType, MealUsage, Student } from "@/lib/api/canteen-types";
import type { ApiError } from "@/lib/api/types";

function StudentAvatar({ student }: { student: Student }) {
  if (student.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- photo distante non gérée par next/image pour l'instant
    return <img src={student.photoUrl} alt="" className="h-14 w-14 flex-none rounded-full object-cover" />;
  }

  const initials = student.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      aria-hidden
      className="flex h-14 w-14 flex-none items-center justify-center rounded-full bg-surface font-mono text-sm font-semibold text-text-muted"
    >
      {initials}
    </span>
  );
}

export default function CantinePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState("");

  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lookupResult, setLookupResult] = useState<FoodPassLookupResult | null>(null);
  const [lookupError, setLookupError] = useState<ApiError | null>(null);

  const [distributing, setDistributing] = useState<MealType | null>(null);
  const [distributeError, setDistributeError] = useState<ApiError | null>(null);
  const [distributeSuccess, setDistributeSuccess] = useState<MealType | null>(null);

  function resetScan() {
    setCode("");
    setLookupStatus("idle");
    setLookupResult(null);
    setLookupError(null);
    setDistributeError(null);
    setDistributeSuccess(null);
    inputRef.current?.focus();
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lookupStatus === "loading" || !code.trim()) return;

    setLookupStatus("loading");
    setLookupError(null);
    setLookupResult(null);
    setDistributeError(null);
    setDistributeSuccess(null);

    const result = await apiFetch<FoodPassLookupResult>(
      `/api/v1/canteen/lookup?code=${encodeURIComponent(code.trim())}`,
    );

    if (result.ok) {
      setLookupResult(result.data);
      setLookupStatus("success");
    } else {
      setLookupError(result.error);
      setLookupStatus("error");
    }
  }

  async function handleDistribute(mealType: MealType) {
    if (!lookupResult || distributing) return;

    setDistributing(mealType);
    setDistributeError(null);
    setDistributeSuccess(null);

    const result = await apiFetch<MealUsage>("/api/v1/canteen/distribute", {
      method: "POST",
      body: JSON.stringify({ studentId: lookupResult.student.id, mealType }),
    });

    setDistributing(null);

    if (!result.ok) {
      setDistributeError(result.error);
      return;
    }

    setDistributeSuccess(mealType);

    // Le statut "déjà distribué" affiché ensuite vient de ce refetch réel,
    // jamais d'un état local qu'on positionnerait soi-même.
    const refreshed = await apiFetch<FoodPassLookupResult>(
      `/api/v1/canteen/lookup?code=${encodeURIComponent(lookupResult.student.foodPassCode)}`,
    );
    if (refreshed.ok) {
      setLookupResult(refreshed.data);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-lg font-semibold text-text">Cantine — Distribution Food Pass</h1>
      <p className="mt-1 text-sm text-text-muted">Scannez ou saisissez le code Food Pass de l&apos;étudiant.</p>

      <form onSubmit={handleLookup} className="mt-6 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Code Food Pass"
          aria-label="Code Food Pass"
          autoFocus
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="flex-none rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          Scanner
        </button>
        <button
          type="submit"
          disabled={lookupStatus === "loading" || !code.trim()}
          className="flex-none rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Rechercher
        </button>
      </form>

      <div className="mt-6">
        {lookupStatus === "loading" ? <LoadingState label="Recherche du Food Pass..." /> : null}

        {lookupStatus === "error" && lookupError ? (
          <ErrorState code={lookupError.code} traceId={lookupError.traceId}>
            <button
              type="button"
              onClick={resetScan}
              className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
            >
              Rescanner
            </button>
          </ErrorState>
        ) : null}

        {lookupStatus === "success" && lookupResult ? (
          <div className="rounded-lg border border-border bg-surface-raised p-5">
            <div className="flex items-center gap-4">
              <StudentAvatar student={lookupResult.student} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold text-text">{lookupResult.student.fullName}</p>
                <p
                  className={`text-sm ${
                    lookupResult.subscriptionActive ? "text-status-ready-text" : "text-status-alert-text"
                  }`}
                >
                  {lookupResult.subscriptionActive ? "Abonnement actif" : "Abonnement inactif"}
                </p>
              </div>
            </div>

            {!lookupResult.subscriptionActive ? (
              <p className="mt-3 rounded-md border border-status-alert/40 bg-status-alert/5 px-3 py-2 text-sm text-status-alert-text">
                Distribution bloquée — abonnement inactif.
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              {(["LUNCH", "DINNER"] as MealType[]).map((mealType) => {
                const alreadyUsed = lookupResult.alreadyUsedToday[mealType] === true;
                const isPending = distributing === mealType;
                const blocked = !lookupResult.subscriptionActive;

                return (
                  <button
                    key={mealType}
                    type="button"
                    onClick={() => handleDistribute(mealType)}
                    disabled={blocked || alreadyUsed || isPending || distributing !== null}
                    className="w-full rounded-md bg-brand px-4 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface disabled:text-text-muted disabled:opacity-100"
                  >
                    {blocked
                      ? `${MEAL_TYPE_LABELS[mealType]} — Abonnement inactif`
                      : alreadyUsed
                        ? `${MEAL_TYPE_LABELS[mealType]} — Déjà distribué aujourd'hui`
                        : isPending
                          ? "Distribution..."
                          : `Distribuer — ${MEAL_TYPE_LABELS[mealType]}`}
                  </button>
                );
              })}
            </div>

            {distributeSuccess ? (
              <p className="mt-3 rounded-md border border-status-ready/40 bg-status-ready/5 px-3 py-2 text-sm text-status-ready-text">
                {MEAL_TYPE_LABELS[distributeSuccess]} distribué avec succès.
              </p>
            ) : null}

            {distributeError ? (
              <div className="mt-3">
                <ErrorState code={distributeError.code} traceId={distributeError.traceId} />
              </div>
            ) : null}

            <button
              type="button"
              onClick={resetScan}
              className="mt-4 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-muted transition-colors hover:text-text"
            >
              Scan suivant
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
