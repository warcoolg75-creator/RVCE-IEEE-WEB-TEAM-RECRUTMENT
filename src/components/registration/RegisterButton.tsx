import { useState } from "react";
import type { CampusEvent } from "@/types";
import { useData } from "@/store/DataContext";
import { useRegistrationStore } from "@/store/registrationStore";
import { toast } from "@/store/toast";
import { conflictsWith } from "@/utils/conflictDetection";
import { getRegistrationState } from "@/utils/registrationState";
import { formatTime } from "@/utils/dateHelpers";
import { TicketIcon, CheckIcon } from "@/components/icons";

/**
 * Register / unregister control. "Register" = "I'm attending" (distinct from
 * bookmark). Reflects full/cancelled/past states, warns on schedule conflicts,
 * and asks for confirmation before cancelling.
 */
export function RegisterButton({
  event,
  variant = "compact",
  className = "",
}: {
  event: CampusEvent;
  variant?: "compact" | "full";
  className?: string;
}) {
  const { byId } = useData();
  const registered = useRegistrationStore((s) => s.registrations.some((r) => r.eventId === event.id));
  const register = useRegistrationStore((s) => s.registerForEvent);
  const cancel = useRegistrationStore((s) => s.cancelRegistration);
  const [confirming, setConfirming] = useState(false);

  const state = getRegistrationState(event, registered);
  const full = variant === "full";

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const doRegister = (e: React.MouseEvent) => {
    stop(e);
    register(event.id);
    const others = useRegistrationStore
      .getState()
      .registrations.filter((r) => r.eventId !== event.id)
      .map((r) => byId.get(r.eventId))
      .filter((x): x is CampusEvent => !!x);
    const clash = conflictsWith(event, others)[0];
    if (clash) {
      toast.error(
        `⚠️ Schedule conflict! “${trim(event.title)}” overlaps with “${trim(clash.title)}”${
          clash.startTime !== null ? ` at ${formatTime(clash.startTime)}` : ""
        }`
      );
    } else {
      toast.success(`🎟️ Registered for “${trim(event.title)}”`);
    }
  };

  const doCancel = (e: React.MouseEvent) => {
    stop(e);
    cancel(event.id);
    setConfirming(false);
    toast.info(`Registration cancelled for “${trim(event.title)}”`);
  };

  /* ---- disabled states ---- */
  if (state === "cancelled" || state === "past" || state === "full") {
    const label =
      state === "cancelled"
        ? "Event Cancelled"
        : state === "past"
        ? "Event has passed"
        : "Registration Full";
    if (!full) {
      return (
        <button
          type="button"
          disabled
          onClick={stop}
          aria-label={label}
          title={label}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-content-faint opacity-60 ${
            state === "cancelled" ? "line-through" : ""
          } ${className}`}
        >
          <TicketIcon width={13} height={13} aria-hidden="true" />
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled
        className={`btn px-4 py-2.5 border border-border text-content-faint opacity-70 ${
          state === "cancelled" ? "line-through" : ""
        } ${className}`}
      >
        <TicketIcon width={16} height={16} aria-hidden="true" /> {label}
      </button>
    );
  }

  /* ---- registered (with cancel confirm) ---- */
  if (state === "registered") {
    if (confirming) {
      return (
        <span className={`inline-flex items-center gap-1.5 ${className}`}>
          <span className={`${full ? "text-sm" : "text-xs"} font-medium text-content-muted`}>
            Cancel?
          </span>
          <button
            type="button"
            onClick={doCancel}
            aria-label="Confirm cancel registration"
            className="rounded-lg bg-rose-500 px-2 py-1 text-xs font-semibold text-white hover:opacity-90"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              setConfirming(false);
            }}
            aria-label="Keep registration"
            className="rounded-lg border border-border px-2 py-1 text-xs font-semibold text-content hover:bg-surface"
          >
            No
          </button>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setConfirming(true);
        }}
        aria-label="You're registered — cancel registration"
        title="Registered — click to cancel"
        className={
          full
            ? `btn border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300 ${className}`
            : `inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-500/30 hover:bg-emerald-500/25 dark:text-emerald-300 ${className}`
        }
      >
        <CheckIcon width={full ? 16 : 13} height={full ? 16 : 13} strokeWidth={3} aria-hidden="true" />
        {full ? "Registered" : "Registered"}
      </button>
    );
  }

  /* ---- default: register ---- */
  return (
    <button
      type="button"
      onClick={doRegister}
      aria-label={`Register for ${event.title}`}
      title="Register"
      className={
        full
          ? `btn-primary px-4 py-2.5 ${className}`
          : `inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-fg hover:opacity-90 ${className}`
      }
    >
      <TicketIcon width={full ? 16 : 13} height={full ? 16 : 13} aria-hidden="true" />
      {full ? "Register for this Event" : "Register"}
    </button>
  );
}

function trim(s: string): string {
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}
