import { useState } from "react";
import { useBookmarkStore } from "@/store/bookmarks";
import { toast } from "@/store/toast";
import { useData } from "@/store/DataContext";
import { conflictsWith } from "@/utils/conflictDetection";
import { formatTime } from "@/utils/dateHelpers";
import { BookmarkIcon } from "./icons";

/**
 * Toggle button for bookmarking an event. Fires a toast with an Undo action.
 * Used both on cards (compact) and the detail page (labelled).
 */
export function BookmarkButton({
  id,
  title,
  variant = "icon",
  className = "",
}: {
  id: string;
  title: string;
  variant?: "icon" | "labelled";
  className?: string;
}) {
  const bookmarked = useBookmarkStore((s) => s.ids.includes(id));
  const toggle = useBookmarkStore((s) => s.toggle);
  const { byId } = useData();
  const [anim, setAnim] = useState<"pop" | "shrink" | null>(null);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowOn = toggle(id);
    setAnim(nowOn ? "pop" : "shrink");
    window.setTimeout(() => setAnim(null), 240);
    const short = title.length > 40 ? title.slice(0, 40) + "…" : title;
    if (nowOn) {
      toast.success(`Bookmarked “${short}”`, {
        label: "Undo",
        onClick: () => useBookmarkStore.getState().remove(id),
      });
      // Warn if this newly-bookmarked event clashes with another bookmark.
      const event = byId.get(id);
      if (event) {
        const others = useBookmarkStore
          .getState()
          .ids.filter((x) => x !== id)
          .map((x) => byId.get(x))
          .filter((x): x is NonNullable<typeof x> => !!x);
        const clash = conflictsWith(event, others)[0];
        if (clash) {
          toast.error(
            `⚠️ Conflicts with “${clash.title}”${
              clash.startTime !== null ? ` at ${formatTime(clash.startTime)}` : ""
            }`
          );
        }
      }
    } else {
      toast.info(`Removed “${short}”`, {
        label: "Undo",
        onClick: () => useBookmarkStore.getState().add(id),
      });
    }
  };

  const label = bookmarked ? "Remove bookmark" : "Add bookmark";
  const animClass =
    anim === "pop" ? "animate-bookmark-pop" : anim === "shrink" ? "animate-bookmark-shrink" : "";

  if (variant === "labelled") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={bookmarked}
        className={`btn px-4 py-2 border ${
          bookmarked
            ? "bg-brand text-brand-fg border-brand"
            : "border-border text-content hover:bg-surface"
        } ${className}`}
      >
        <BookmarkIcon filled={bookmarked} width={18} height={18} className={animClass} />
        {bookmarked ? "Bookmarked" : "Bookmark"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={bookmarked}
      aria-label={label}
      title={label}
      className={`grid h-11 w-11 place-items-center rounded-full transition-colors ${
        bookmarked
          ? "text-brand bg-brand-subtle"
          : "text-content-faint hover:text-content hover:bg-surface-subtle"
      } ${className}`}
    >
      <BookmarkIcon filled={bookmarked} width={18} height={18} className={animClass} />
    </button>
  );
}
