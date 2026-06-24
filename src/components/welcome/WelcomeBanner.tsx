import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useActiveProfile } from "@/store/profileStore";
import { useData } from "@/store/DataContext";
import { useRegistrationStore } from "@/store/registrationStore";
import { CloseIcon } from "@/components/icons";

const SHOWN_KEY = "rvce_welcome_shown";

/**
 * Subtle "welcome back" banner shown once per session for returning users.
 * Message adapts to upcoming registrations and time-since-last-visit.
 */
export function WelcomeBanner() {
  const profile = useActiveProfile();
  const { events, byId } = useData();
  const registrations = useRegistrationStore((s) => s.registrations);

  // Snapshot last-visit at mount (before App refreshes it).
  const [lastVisitMs] = useState(() => (profile ? Date.parse(profile.lastVisitAt) : Date.now()));
  const [visible, setVisible] = useState(() => {
    try {
      return sessionStorage.getItem(SHOWN_KEY) !== "1";
    } catch {
      return false;
    }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    // Defer setting the "shown" flag so StrictMode's mount→unmount→mount cycle
    // (dev) cancels it on cleanup and the real mount still shows the banner.
    const flag = setTimeout(() => {
      try {
        sessionStorage.setItem(SHOWN_KEY, "1");
      } catch {
        /* ignore */
      }
    }, 120);
    const fade = setTimeout(() => setLeaving(true), 5000);
    const hide = setTimeout(() => setVisible(false), 5400);
    return () => {
      clearTimeout(flag);
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, [visible]);

  const message = useMemo(() => {
    if (!profile) return "";
    const firstName = profile.name.split(/\s+/)[0];
    const days = Math.floor((Date.now() - lastVisitMs) / 86_400_000);

    const upcoming = registrations
      .map((r) => byId.get(r.eventId))
      .filter((e): e is NonNullable<typeof e> => !!e && e.startTime !== null && e.startTime >= Date.now())
      .sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0));

    if (days >= 7) {
      const fresh = events.filter((e) => e.createdAt !== null && e.createdAt > lastVisitMs).length;
      return fresh > 0
        ? `Welcome back, ${firstName}! We missed you — ${fresh.toLocaleString()} new events since your last visit.`
        : `Welcome back, ${firstName}! We missed you 💜`;
    }
    if (upcoming.length > 0) {
      const next = upcoming[0];
      return `Welcome back, ${firstName}! You have ${upcoming.length} upcoming event${
        upcoming.length === 1 ? "" : "s"
      } — next is ${next.title} in ${formatDistanceToNowStrict(next.startTime!)}.`;
    }
    return `Welcome back, ${firstName}! 👋`;
  }, [profile, lastVisitMs, registrations, byId, events]);

  if (!visible || !profile) return null;

  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-medium text-white ${
        leaving ? "animate-fade-out" : "animate-fade-in-fast"
      }`}
    >
      <span className="truncate">{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss welcome message"
        className="shrink-0 rounded-full p-0.5 text-white/80 hover:bg-white/20 hover:text-white"
      >
        <CloseIcon width={16} height={16} aria-hidden="true" />
      </button>
    </div>
  );
}
