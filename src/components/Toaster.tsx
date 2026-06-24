import { useToastStore, TOAST_DURATION } from "@/store/toast";
import { CheckIcon, CloseIcon, BookmarkIcon } from "./icons";

const VARIANT_STYLES: Record<string, string> = {
  success: "text-emerald-500",
  info: "text-brand",
  error: "text-rose-500",
};
const PROGRESS_STYLES: Record<string, string> = {
  success: "bg-emerald-500",
  info: "bg-brand",
  error: "bg-rose-500",
};

/** Bottom-right stack of transient notifications with a time-remaining bar. */
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-end gap-2 px-4 sm:right-4 sm:items-end"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          aria-live="polite"
          className="pointer-events-auto relative flex w-full max-w-sm animate-toast-in-right items-center gap-3
            overflow-hidden rounded-xl border border-border bg-surface-raised px-4 py-3 shadow-lg shadow-black/10"
        >
          <span className={VARIANT_STYLES[t.variant]} aria-hidden="true">
            {t.variant === "info" ? (
              <BookmarkIcon width={18} height={18} />
            ) : (
              <CheckIcon width={18} height={18} />
            )}
          </span>
          <p className="flex-1 text-sm text-content">{t.message}</p>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className="text-sm font-semibold text-brand hover:underline"
            >
              {t.action.label}
            </button>
          )}
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="text-content-faint hover:text-content"
          >
            <CloseIcon width={16} height={16} aria-hidden="true" />
          </button>
          {/* time-remaining progress bar */}
          <span
            aria-hidden="true"
            className={`absolute bottom-0 left-0 h-0.5 w-full origin-left ${PROGRESS_STYLES[t.variant]}`}
            style={{ animation: `toast-progress ${TOAST_DURATION}ms linear forwards` }}
          />
        </div>
      ))}
    </div>
  );
}
