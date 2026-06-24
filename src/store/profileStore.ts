import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useBookmarkStore } from "./bookmarks";
import { useRegistrationStore } from "./registrationStore";
import { avatarColor, getInitials } from "@/utils/avatarColor";

export interface UserProfile {
  id: string;
  name: string;
  usn?: string;
  email?: string;
  branch: string | null;
  avatarColor: string;
  createdAt: string;
  lastVisitAt: string;
  preferences: {
    theme: "light" | "dark" | "system";
    defaultView: "grid" | "timeline";
  };
}

interface ProfileState {
  profiles: UserProfile[];
  activeId: string | null;
  /** Session-only: user signed out → show the profile picker even though data exists. */
  signedOut: boolean;

  createProfile: (data: Partial<UserProfile>) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  switchProfile: (id: string) => void;
  clearProfile: () => void; // full reset (wipe everything)
  signOut: () => void;
  touchVisit: () => void;
  getInitials: () => string;
  daysSinceLastVisit: () => number;
  isNewUser: () => boolean;
}

const PROFILES_KEY = "rvce_profiles";
const SIGNED_OUT_KEY = "rvce_signed_out";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
}

/** Save the live bookmark/registration stores into a profile's namespace. */
function snapshot(id: string) {
  try {
    localStorage.setItem(`rvce_bookmarks_${id}`, JSON.stringify(useBookmarkStore.getState().ids));
    localStorage.setItem(
      `rvce_registrations_${id}`,
      JSON.stringify(useRegistrationStore.getState().registrations)
    );
  } catch {
    /* ignore */
  }
}

/** Load a profile's namespaced data into the live stores. */
function loadInto(id: string) {
  try {
    const b = JSON.parse(localStorage.getItem(`rvce_bookmarks_${id}`) ?? "[]");
    const r = JSON.parse(localStorage.getItem(`rvce_registrations_${id}`) ?? "[]");
    useBookmarkStore.setState({ ids: Array.isArray(b) ? b : [] });
    useRegistrationStore.setState({ registrations: Array.isArray(r) ? r : [] });
  } catch {
    useBookmarkStore.setState({ ids: [] });
    useRegistrationStore.setState({ registrations: [] });
  }
}

function initialSignedOut(): boolean {
  try {
    return sessionStorage.getItem(SIGNED_OUT_KEY) === "1";
  } catch {
    return false;
  }
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeId: null,
      signedOut: initialSignedOut(),

      createProfile: (data) => {
        const state = get();
        // Preserve the currently-active profile's data before switching away.
        if (state.activeId) snapshot(state.activeId);

        const id = uuid();
        const name = (data.name ?? "").trim();
        const now = new Date().toISOString();
        const profile: UserProfile = {
          id,
          name,
          usn: data.usn?.trim() || undefined,
          email: data.email?.trim() || undefined,
          branch: data.branch ?? null,
          avatarColor: avatarColor(name),
          createdAt: now,
          lastVisitAt: now,
          preferences: { theme: "system", defaultView: "grid" },
        };

        // First profile ever inherits any pre-existing bookmarks/registrations
        // (migration). Additional profiles start clean.
        if (state.profiles.length > 0) {
          useBookmarkStore.setState({ ids: [] });
          useRegistrationStore.setState({ registrations: [] });
        }

        set({ profiles: [...state.profiles, profile], activeId: id, signedOut: false });
        try {
          sessionStorage.removeItem(SIGNED_OUT_KEY);
        } catch {
          /* ignore */
        }
        snapshot(id);
      },

      updateProfile: (data) =>
        set((s) => {
          if (!s.activeId) return s;
          return {
            profiles: s.profiles.map((p) =>
              p.id === s.activeId
                ? {
                    ...p,
                    ...data,
                    avatarColor: data.name ? avatarColor(data.name) : p.avatarColor,
                  }
                : p
            ),
          };
        }),

      switchProfile: (id) => {
        const s = get();
        if (id !== s.activeId) {
          if (s.activeId) snapshot(s.activeId);
          loadInto(id);
        }
        set({
          activeId: id,
          signedOut: false,
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, lastVisitAt: new Date().toISOString() } : p
          ),
        });
        try {
          sessionStorage.removeItem(SIGNED_OUT_KEY);
        } catch {
          /* ignore */
        }
      },

      clearProfile: () => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch {
          /* ignore */
        }
        useBookmarkStore.setState({ ids: [] });
        useRegistrationStore.setState({ registrations: [] });
        set({ profiles: [], activeId: null, signedOut: false });
      },

      signOut: () => {
        const s = get();
        if (s.activeId) snapshot(s.activeId);
        try {
          sessionStorage.setItem(SIGNED_OUT_KEY, "1");
        } catch {
          /* ignore */
        }
        set({ signedOut: true });
      },

      touchVisit: () =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === s.activeId ? { ...p, lastVisitAt: new Date().toISOString() } : p
          ),
        })),

      getInitials: () => {
        const s = get();
        const p = s.profiles.find((x) => x.id === s.activeId);
        return p ? getInitials(p.name) : "?";
      },

      daysSinceLastVisit: () => {
        const s = get();
        const p = s.profiles.find((x) => x.id === s.activeId);
        if (!p) return 0;
        return Math.floor((Date.now() - Date.parse(p.lastVisitAt)) / 86_400_000);
      },

      isNewUser: () => get().profiles.length === 0,
    }),
    {
      name: PROFILES_KEY,
      version: 1,
      partialize: (s) => ({ profiles: s.profiles, activeId: s.activeId }),
    }
  )
);

/** Convenience hook: the currently-active profile (or null). */
export function useActiveProfile(): UserProfile | null {
  return useProfileStore((s) => s.profiles.find((p) => p.id === s.activeId) ?? null);
}

/** Should the onboarding / picker screen be shown? */
export function useShouldOnboard(): boolean {
  return useProfileStore((s) => {
    const active = s.profiles.find((p) => p.id === s.activeId) ?? null;
    return !active || s.signedOut;
  });
}
