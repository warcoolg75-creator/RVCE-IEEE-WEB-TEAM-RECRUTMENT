import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BOOKMARKS_STORAGE_KEY } from "@/utils/constants";

interface BookmarkState {
  /** Set of bookmarked event ids. Stored as an array for JSON persistence. */
  ids: string[];
  isBookmarked: (id: string) => boolean;
  toggle: (id: string) => boolean; // returns the new state (true = bookmarked)
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/**
 * Bookmarks persisted to localStorage. We keep ids only (not full events) so
 * the store stays tiny and always reflects the freshly normalized dataset.
 */
export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      ids: [],
      isBookmarked: (id) => get().ids.includes(id),
      toggle: (id) => {
        const has = get().ids.includes(id);
        set((s) => ({
          ids: has ? s.ids.filter((x) => x !== id) : [...s.ids, id],
        }));
        return !has;
      },
      add: (id) =>
        set((s) => (s.ids.includes(id) ? s : { ids: [...s.ids, id] })),
      remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: BOOKMARKS_STORAGE_KEY,
      version: 1,
    }
  )
);
