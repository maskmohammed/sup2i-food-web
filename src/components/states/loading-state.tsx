type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Chargement..." }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-surface-raised py-10 text-center"
    >
      <span
        aria-hidden
        className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-brand"
      />
      <p className="text-sm text-text-muted">{label}</p>
    </div>
  );
}
