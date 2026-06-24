import { useRegistrationStore } from "@/store/registrationStore";
import { CheckIcon } from "@/components/icons";

/**
 * Small "✓ Registered" badge shown on cards/pills for events the user has
 * registered for, so registration status is visible at a glance while browsing.
 */
export function RegistrationBadge({
  eventId,
  variant = "badge",
}: {
  eventId: string;
  variant?: "badge" | "dot";
}) {
  const registered = useRegistrationStore((s) => s.registrations.some((r) => r.eventId === eventId));
  if (!registered) return null;

  if (variant === "dot") {
    return (
      <span
        className="inline-block h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-surface-raised"
        title="You're registered"
        aria-label="Registered"
      />
    );
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/30 dark:text-emerald-300"
      aria-label="You're registered for this event"
    >
      <CheckIcon width={11} height={11} strokeWidth={3} aria-hidden="true" />
      Registered
    </span>
  );
}
