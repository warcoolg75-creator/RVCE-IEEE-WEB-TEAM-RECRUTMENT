import { useEffect, useState } from "react";
import { ArrowUpIcon } from "./icons";

/**
 * Floating "back to top" button. Works with a custom scroll element (the
 * virtualized list scroller) or falls back to the window.
 */
export function BackToTop({ getScroller }: { getScroller?: () => HTMLElement | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = getScroller?.() ?? null;
    const target: HTMLElement | Window = el ?? window;
    const read = () => (el ? el.scrollTop : window.scrollY);
    const onScroll = () => setVisible(read() > 300);
    target.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => target.removeEventListener("scroll", onScroll);
  }, [getScroller]);

  const toTop = () => {
    const el = getScroller?.() ?? null;
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label="Back to top"
      className={`group fixed bottom-5 right-5 z-30 grid h-11 w-11 place-items-center rounded-full
        border border-border bg-surface-raised text-content shadow-lg shadow-black/10
        transition-all duration-300 hover:bg-surface hover:-translate-y-0.5 ${
          visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
    >
      <ArrowUpIcon
        width={18}
        height={18}
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:-rotate-180"
      />
    </button>
  );
}
