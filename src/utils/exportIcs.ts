import type { CampusEvent } from "@/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Epoch ms → iCalendar UTC timestamp, e.g. 20261004T170505Z */
function toICSDate(ts: number): string {
  const d = new Date(ts);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape per RFC 5545. */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long lines to 75 octets per RFC 5545 (CRLF + leading space). */
function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

/**
 * Build a valid iCalendar string from events. Events without a start time are
 * skipped (the count is returned). Each VEVENT includes SUMMARY, DESCRIPTION,
 * DTSTART, DTEND (start + 1h when no end), LOCATION and ORGANIZER so the file
 * imports cleanly into Google / Apple / Outlook calendars.
 */
export function buildICS(events: CampusEvent[]): { ics: string; skipped: number } {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RVCE Campus Events//EN",
    "CALSCALE:GREGORIAN",
  ];
  let skipped = 0;

  for (const e of events) {
    if (e.startTime === null) {
      skipped++;
      continue;
    }
    const end = e.endTime !== null && e.endTime > e.startTime ? e.endTime : e.startTime + 3_600_000;
    lines.push(
      "BEGIN:VEVENT",
      fold(`UID:${e.id}@rvce-campus-events`),
      `DTSTAMP:${toICSDate(Date.now())}`,
      `DTSTART:${toICSDate(e.startTime)}`,
      `DTEND:${toICSDate(end)}`,
      fold(`SUMMARY:${escapeICS(e.title)}`),
      fold(`DESCRIPTION:${escapeICS(e.description || `Hosted by ${e.organizer}`)}`),
      fold(`LOCATION:${escapeICS(e.location?.label ?? "")}`),
      fold(`ORGANIZER;CN=${escapeICS(e.organizer)}:mailto:${e.contactEmail ?? "events@rvce.edu.in"}`),
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return { ics: lines.join("\r\n"), skipped };
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Download events as an .ics file; returns the count skipped (undated). */
export function exportEventsICS(events: CampusEvent[], filename = "rvce-schedule.ics"): number {
  const { ics, skipped } = buildICS(events);
  downloadFile(filename, ics, "text/calendar;charset=utf-8");
  return skipped;
}
