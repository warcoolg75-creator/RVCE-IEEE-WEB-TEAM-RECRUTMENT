import type { ReactNode } from "react";

/**
 * Reusable centered empty/error state: icon + title + message + optional
 * action. Used for every "nothing here" / error scenario across the app for a
 * consistent look.
 */
export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-in flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-20 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-subtle text-brand">
        {icon}
      </div>
      <h2 className="text-base font-semibold text-content">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm text-content-muted">{message}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
