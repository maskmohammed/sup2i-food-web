import type { ReactNode } from "react";
import { getErrorMessage } from "@/lib/error-messages";

type ErrorStateProps = {
  code: string;
  traceId?: string;
  children?: ReactNode;
};

export function ErrorState({ code, traceId, children }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-status-alert/40 bg-status-alert/5 py-10 text-center">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-status-alert"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5" />
        <path d="M12 16h.01" />
      </svg>
      <p className="text-sm font-medium text-text">{getErrorMessage(code)}</p>
      {traceId ? (
        <p className="font-mono text-xs text-text-muted">Réf : {traceId}</p>
      ) : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
