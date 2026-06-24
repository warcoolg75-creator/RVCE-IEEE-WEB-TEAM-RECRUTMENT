import type { CampusEvent } from "@/types";

export type RegistrationState =
  | "default"
  | "registered"
  | "full"
  | "cancelled"
  | "past";

export function isPastEvent(e: CampusEvent): boolean {
  return e.startTime !== null && e.startTime < Date.now();
}

export function isFullEvent(e: CampusEvent): boolean {
  return (
    e.currentRegistrations !== null &&
    e.maxCapacity !== null &&
    e.maxCapacity > 0 &&
    e.currentRegistrations >= e.maxCapacity
  );
}

/** Can the user still register? (not registered, not full/cancelled/past) */
export function canRegister(e: CampusEvent, registered: boolean): boolean {
  return !registered && !e.isCancelled && !isPastEvent(e) && !isFullEvent(e);
}

/** Resolve the button state. Registered takes priority so users can always cancel. */
export function getRegistrationState(e: CampusEvent, registered: boolean): RegistrationState {
  if (e.isCancelled) return "cancelled";
  if (registered) return "registered";
  if (isPastEvent(e)) return "past";
  if (isFullEvent(e)) return "full";
  return "default";
}
