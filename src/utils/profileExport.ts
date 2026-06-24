import type { UserProfile } from "@/store/profileStore";
import { useBookmarkStore } from "@/store/bookmarks";
import { useRegistrationStore } from "@/store/registrationStore";
import { downloadFile } from "./exportIcs";

/**
 * Bundle the active profile + their bookmarks + registrations (with notes)
 * into a single JSON download — a complete, portable copy of the user's data.
 */
export function exportUserData(profile: UserProfile): void {
  const bundle = {
    exportedAt: new Date().toISOString(),
    profile,
    bookmarks: useBookmarkStore.getState().ids,
    registrations: useRegistrationStore.getState().registrations,
  };
  const safeName = profile.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "user";
  downloadFile(`rvce-data-${safeName}.json`, JSON.stringify(bundle, null, 2), "application/json");
}
