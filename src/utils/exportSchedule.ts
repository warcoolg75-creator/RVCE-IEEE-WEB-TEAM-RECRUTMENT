import type { CampusEvent } from "@/types";
import { downloadFile } from "./exportIcs";

/** Download bookmarked events as formatted JSON. */
export function exportScheduleJSON(events: CampusEvent[]): void {
  downloadFile("rvce-bookmarks.json", JSON.stringify(events, null, 2), "application/json");
}

/**
 * Print the schedule. The printable markup lives in #print-root (rendered on
 * the Bookmarks page); print.css hides everything else and reveals it, so this
 * just triggers the browser's print/"Save as PDF" dialog.
 */
export function printSchedule(): void {
  window.print();
}
