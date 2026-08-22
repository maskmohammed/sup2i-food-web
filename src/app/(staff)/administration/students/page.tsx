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
import type { Student } from "@/lib/api/students-types";

function StudentAvatar({ student }: { student: Student }) {
  if (student.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- photo distante non gérée par next/image pour l'instant
    return <img src={student.photoUrl} alt="" className="h-10 w-10 flex-none rounded-full object-cover" />;
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
      className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-surface font-mono text-xs font-semibold text-text-muted"
    >
      {initials}
    </span>
  );
}

function PhotoForm({
  student,
  onCancel,
  onDone,
}: {
  student: Student;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [photoUrl, setPhotoUrl] = useState(student.photoUrl);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    const result = await apiFetch<Student>(`/api/v1/admin/students/${student.id}/photo`, {
      method: "POST",
      body: JSON.stringify({ photoUrl: photoUrl.trim() }),
    });

    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface p-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`photo-${student.id}`} className="text-sm text-text-muted">
          URL de la photo (simulation d&apos;upload)
        </label>
        <input
          id={`photo-${student.id}`}
          type="text"
          value={photoUrl}
          onChange={(event) => setPhotoUrl(event.target.value)}
          placeholder="https://..."
          className="rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text outline-none focus:border-brand"
        />
      </div>

      {error ? <ErrorState code={error.code} traceId={error.traceId} /> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="flex-1 rounded-md border border-border bg-surface-raised px-3 py-2 text-sm text-text-muted transition-colors hover:text-text disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Enregistrement..." : "Confirmer"}
        </button>
      </div>
    </form>
  );
}

export default function StudentsPage() {
  const { status, data, error, refetch } = useApiQuery<Student[]>("/api/v1/admin/students");

  const [fullName, setFullName] = useState("");
  const [foodPassCode, setFoodPassCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<ApiError | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<ApiError | null>(null);

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;

    setCreating(true);
    setCreateError(null);

    const result = await apiFetch<Student>("/api/v1/admin/students", {
      method: "POST",
      body: JSON.stringify({ fullName, foodPassCode }),
    });

    setCreating(false);

    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setFullName("");
    setFoodPassCode("");
    refetch();
  }

  async function handleToggleSubscription(student: Student) {
    if (togglingId) return;

    setTogglingId(student.id);
    setToggleError(null);

    const result = await apiFetch<Student>(`/api/v1/admin/students/${student.id}/subscription`, {
      method: "PATCH",
      body: JSON.stringify({ active: !student.subscriptionActive }),
    });

    setTogglingId(null);

    if (!result.ok) {
      setToggleError(result.error);
      return;
    }

    refetch();
  }

  return (
    <RequireRole allowedRoles={NAV_SECTION_ROLES.students}>
      <div>
        <h1 className="text-lg font-semibold text-text">Étudiants</h1>
        <p className="mt-1 text-sm text-text-muted">
          Gestion des comptes étudiants, abonnement Food Pass et photo — données mockées.
        </p>

        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-surface-raised p-4 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-name" className="text-sm text-text-muted">
              Nom complet
            </label>
            <input
              id="student-name"
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="student-code" className="text-sm text-text-muted">
              Code Food Pass
            </label>
            <input
              id="student-code"
              type="text"
              required
              value={foodPassCode}
              onChange={(event) => setFoodPassCode(event.target.value)}
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text font-mono outline-none focus:border-brand"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Création..." : "Créer l'étudiant"}
          </button>
        </form>

        {createError ? (
          <div className="mt-4">
            <ErrorState code={createError.code} traceId={createError.traceId} />
          </div>
        ) : null}

        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold text-text">Liste des étudiants</h2>

          {status === "loading" ? <LoadingState label="Chargement des étudiants..." /> : null}

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
                title="Aucun étudiant"
                description="Créez un premier étudiant avec le formulaire ci-dessus."
              />
            ) : (
              <ul className="flex flex-col gap-3">
                {data.map((student) => (
                  <li key={student.id} className="rounded-lg border border-border bg-surface-raised p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <StudentAvatar student={student} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text">{student.fullName}</p>
                          <p className="font-mono text-xs text-text-muted">{student.foodPassCode}</p>
                        </div>
                        <span
                          className={`flex-none whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${
                            student.subscriptionActive
                              ? "border-status-ready text-status-ready-text"
                              : "border-status-alert text-status-alert-text"
                          }`}
                        >
                          {student.subscriptionActive ? "Actif" : "Inactif"}
                        </span>
                      </div>

                      <div className="flex flex-none gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSubscription(student)}
                          disabled={togglingId === student.id}
                          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised disabled:opacity-50"
                        >
                          {togglingId === student.id
                            ? "..."
                            : student.subscriptionActive
                              ? "Désactiver"
                              : "Activer"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhotoId((prev) => (prev === student.id ? null : student.id))}
                          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-raised"
                        >
                          Modifier la photo
                        </button>
                      </div>
                    </div>

                    {editingPhotoId === student.id ? (
                      <PhotoForm
                        student={student}
                        onCancel={() => setEditingPhotoId(null)}
                        onDone={() => {
                          setEditingPhotoId(null);
                          refetch();
                        }}
                      />
                    ) : null}
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
