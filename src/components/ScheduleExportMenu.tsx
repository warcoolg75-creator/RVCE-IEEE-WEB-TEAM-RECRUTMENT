import { useEffect, useRef, useState } from "react";
import type { CampusEvent } from "@/types";
import { exportEventsICS } from "@/utils/exportIcs";
import { exportScheduleJSON, printSchedule } from "@/utils/exportSchedule";
import { toast } from "@/store/toast";
import { CalendarIcon, DownloadIcon, ExternalIcon, ChevronDownIcon } from "./icons";

/** "Export ↗" dropdown on the Bookmarks page: .ics / PDF / JSON. */
export function ScheduleExportMenu({ events }: { events: CampusEvent[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  const actions = [
    {
      key: "ics",
      label: "Calendar (.ics)",
      icon: <CalendarIcon width={16} height={16} aria-hidden="true" />,
      run: () => {
        const skipped = exportEventsICS(events);
        toast.success(
          skipped > 0
            ? `Exported .ics · ${skipped} undated event${skipped > 1 ? "s" : ""} skipped`
            : "Calendar exported"
        );
      },
    },
    {
      key: "pdf",
      label: "PDF (Print)",
      icon: <ExternalIcon width={16} height={16} aria-hidden="true" />,
      run: () => printSchedule(),
    },
    {
      key: "json",
      label: "JSON",
      icon: <DownloadIcon width={16} height={16} aria-hidden="true" />,
      run: () => {
        exportScheduleJSON(events);
        toast.success("Exported JSON");
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="btn-ghost"
      >
        Export ↗
        <ChevronDownIcon
          width={14}
          height={14}
          aria-hidden="true"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1.5 w-48 overflow-hidden rounded-xl border border-border bg-surface-raised p-1 shadow-xl animate-fade-in-fast"
        >
          {actions.map((a) => (
            <button
              key={a.key}
              type="button"
              role="menuitem"
              onClick={() => {
                a.run();
                close();
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-content hover:bg-surface-subtle"
            >
              <span className="text-content-faint">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
