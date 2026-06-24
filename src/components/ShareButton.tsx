import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CampusEvent } from "@/types";
import { formatDateTime } from "@/utils/dateHelpers";
import { toast } from "@/store/toast";
import { ShareIcon, LinkIcon, CopyIcon, WhatsAppIcon, XIcon } from "./icons";

/**
 * Share control with a dropdown (Copy link / WhatsApp / X / Copy details).
 * On touch devices with the Web Share API it uses the native share sheet
 * instead. The menu renders in a portal so it's never clipped by the
 * virtualized card grid; it closes on outside click, Escape, or scroll.
 */
export function ShareButton({
  event,
  variant = "icon",
  className = "",
}: {
  event: CampusEvent;
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/event/${encodeURIComponent(event.id)}`
      : `/event/${event.id}`;
  const dateText = event.startTime !== null ? formatDateTime(event.startTime) : "Date TBA";
  const venue = event.location?.label ?? "Venue TBA";

  const canNativeShare =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
  };

  useLayoutEffect(() => {
    if (open) place();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open]);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`✓ ${label}`);
    } catch {
      // Fallback for non-secure contexts.
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        toast.success(`✓ ${label}`);
      } catch {
        toast.error("Couldn't copy to clipboard");
      }
      ta.remove();
    }
  };

  const onMainClick = async (e: React.MouseEvent) => {
    stop(e);
    if (canNativeShare) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out "${event.title}" by ${event.organizer}`,
          url,
        });
      } catch {
        /* user dismissed */
      }
      return;
    }
    setOpen((o) => !o);
  };

  const actions: { key: string; label: string; icon: React.ReactNode; run: () => void }[] = [
    {
      key: "link",
      label: "Copy link",
      icon: <LinkIcon width={16} height={16} />,
      run: () => copy(url, "Copied!"),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      icon: <WhatsAppIcon width={16} height={16} />,
      run: () =>
        openExternal(
          `https://wa.me/?text=${encodeURIComponent(
            `Check out "${event.title}" by ${event.organizer} on ${dateText} — ${url}`
          )}`
        ),
    },
    {
      key: "x",
      label: "Share on X",
      icon: <XIcon width={16} height={16} />,
      run: () =>
        openExternal(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            `Check out "${event.title}" by ${event.organizer}`
          )}&url=${encodeURIComponent(url)}`
        ),
    },
    {
      key: "details",
      label: "Copy details",
      icon: <CopyIcon width={16} height={16} />,
      run: () =>
        copy(
          `📅 ${event.title}\n🏛️ ${event.organizer}\n📆 ${dateText}\n📍 ${venue}\n🔗 ${url}`,
          "Details copied!"
        ),
    },
  ];

  return (
    <>
      {variant === "labelled" ? (
        <button ref={btnRef} type="button" onClick={onMainClick} className={`btn-ghost ${className}`}>
          <ShareIcon width={16} height={16} />
          Share
        </button>
      ) : (
        <button
          ref={btnRef}
          type="button"
          onClick={onMainClick}
          aria-label="Share event"
          aria-haspopup="menu"
          aria-expanded={open}
          title="Share"
          className={`grid h-11 w-11 place-items-center rounded-full text-content-faint transition-colors hover:bg-surface-subtle hover:text-content ${className}`}
        >
          <ShareIcon width={18} height={18} />
        </button>
      )}

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            onMouseDown={stop}
            onClick={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: pos.top, right: pos.right }}
            className="z-[60] w-48 overflow-hidden rounded-xl border border-border bg-surface-raised p-1 shadow-xl animate-fade-in-fast"
          >
            {actions.map((a) => (
              <button
                key={a.key}
                type="button"
                role="menuitem"
                onClick={(e) => {
                  stop(e);
                  a.run();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-content hover:bg-surface-subtle"
              >
                <span className="text-content-faint">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

function openExternal(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}
