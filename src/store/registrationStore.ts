import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Registration {
  eventId: string;
  registeredAt: string; // ISO timestamp
  notes?: string; // optional personal notes
}

interface RegistrationStore {
  registrations: Registration[];
  registerForEvent: (eventId: string) => void;
  cancelRegistration: (eventId: string) => void;
  isRegistered: (eventId: string) => boolean;
  updateNotes: (eventId: string, notes: string) => void;
  /** Registrations whose event id is still in the (caller-supplied) set — left
   *  generic here; the schedule page resolves ids against the dataset. */
  getUpcomingRegistrations: () => Registration[];
  clearAllRegistrations: () => void;
}

const STORAGE_KEY = "rvce-registrations";

/**
 * Event registrations ("I'm attending"), persisted to localStorage. Distinct
 * from bookmarks ("save for later"). Stores ids + timestamp + optional notes.
 */
export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set, get) => ({
      registrations: [],
      registerForEvent: (eventId) =>
        set((s) =>
          s.registrations.some((r) => r.eventId === eventId)
            ? s
            : {
                registrations: [
                  ...s.registrations,
                  { eventId, registeredAt: new Date().toISOString() },
                ],
              }
        ),
      cancelRegistration: (eventId) =>
        set((s) => ({ registrations: s.registrations.filter((r) => r.eventId !== eventId) })),
      isRegistered: (eventId) => get().registrations.some((r) => r.eventId === eventId),
      updateNotes: (eventId, notes) =>
        set((s) => ({
          registrations: s.registrations.map((r) =>
            r.eventId === eventId ? { ...r, notes: notes.trim() || undefined } : r
          ),
        })),
      getUpcomingRegistrations: () => get().registrations,
      clearAllRegistrations: () => set({ registrations: [] }),
    }),
    { name: STORAGE_KEY, version: 1 }
  )
);
