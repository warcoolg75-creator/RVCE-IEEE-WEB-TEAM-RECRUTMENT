import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CampusEvent } from "@/types";
import { useUIStore } from "@/store/ui";
import { useBookmarkStore } from "@/store/bookmarks";
import { toast } from "@/store/toast";

/** True when the event originated from a text field we shouldn't hijack. */
function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement | null;
  if (!t) return false;
  return (
    t.tagName === "INPUT" ||
    t.tagName === "TEXTAREA" ||
    t.tagName === "SELECT" ||
    t.isContentEditable
  );
}

function hasModifier(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey || e.altKey;
}

/**
 * Global keyboard shortcuts, active app-wide:
 *  /  focus search · ?  shortcuts help · Esc close help
 *  1/2/3 Feed/Calendar/Bookmarks · D toggle theme
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const setHelpOpen = useUIStore((s) => s.setHelpOpen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape always works (even while typing) to close the help modal.
      if (e.key === "Escape") {
        if (useUIStore.getState().helpOpen) {
          setHelpOpen(false);
          e.preventDefault();
        }
        return;
      }
      if (isTypingTarget(e) || hasModifier(e)) return;

      switch (e.key) {
        case "/":
          focusSearch();
          e.preventDefault();
          break;
        case "?":
          setHelpOpen(true);
          e.preventDefault();
          break;
        case "1":
          navigate("/");
          break;
        case "2":
          navigate("/calendar");
          break;
        case "3":
          navigate("/bookmarks");
          break;
        case "d":
        case "D":
          toggleTheme();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, toggleTheme, setHelpOpen]);
}

function focusSearch() {
  const el = document.querySelector<HTMLInputElement>('input[type="search"]');
  el?.focus();
}

/**
 * Feed-page card navigation: J/K move the focus ring, Enter opens, B toggles
 * bookmark, S copies a share link. Returns the focused index so the grid can
 * render the ring + scroll it into view.
 */
export function useFeedKeyboard(events: CampusEvent[]) {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const navigate = useNavigate();
  const toggle = useBookmarkStore((s) => s.toggle);

  // Reset focus when the visible list changes (filters/search/sort).
  useEffect(() => setFocusedIndex(-1), [events]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e) || hasModifier(e)) return;
      if (useUIStore.getState().helpOpen) return;
      const key = e.key.toLowerCase();

      if (key === "j") {
        setFocusedIndex((i) => Math.min((i < 0 ? -1 : i) + 1, events.length - 1));
        e.preventDefault();
      } else if (key === "k") {
        setFocusedIndex((i) => Math.max((i < 0 ? 0 : i) - 1, 0));
        e.preventDefault();
      } else if (focusedIndex >= 0 && focusedIndex < events.length) {
        const ev = events[focusedIndex];
        if (e.key === "Enter") {
          navigate(`/event/${encodeURIComponent(ev.id)}`);
        } else if (key === "b") {
          const on = toggle(ev.id);
          toast[on ? "success" : "info"](
            `${on ? "Bookmarked" : "Removed"} “${ev.title.slice(0, 40)}”`
          );
          e.preventDefault();
        } else if (key === "s") {
          const url = `${window.location.origin}/event/${encodeURIComponent(ev.id)}`;
          navigator.clipboard?.writeText(url).then(
            () => toast.success("✓ Link copied!"),
            () => toast.error("Couldn't copy link")
          );
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [events, focusedIndex, navigate, toggle]);

  return { focusedIndex, setFocusedIndex };
}
