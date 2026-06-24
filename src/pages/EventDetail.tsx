import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "@/store/DataContext";
import { useBookmarkStore } from "@/store/bookmarks";
import { useRegistrationStore } from "@/store/registrationStore";
import { relatedEvents } from "@/utils/filterEvents";
import { conflictsWith } from "@/utils/conflictDetection";
import { formatDateTime, formatTime, formatDateShort, relativeLabel } from "@/utils/dateHelpers";
import { exportEventsICS } from "@/utils/exportIcs";
import { CategoryBadge } from "@/components/CategoryBadge";
import { BookmarkButton } from "@/components/BookmarkButton";
import { ShareButton } from "@/components/ShareButton";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { PersonalNotes } from "@/components/registration/PersonalNotes";
import { RegistrationBar } from "@/components/RegistrationBar";
import { EventCard } from "@/components/EventCard";
import { EmptyState } from "@/components/empty-states/EmptyState";
import {
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  UsersIcon,
  TicketIcon,
  MailIcon,
  TagIcon,
  ExternalIcon,
  InstagramIcon,
  LinkedinIcon,
  DownloadIcon,
  SparkleIcon,
} from "@/components/icons";

export function EventDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { status, byId, events } = useData();

  const event = byId.get(decodeURIComponent(id));

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const related = useMemo(
    () => (event ? relatedEvents(events, event) : []),
    [event, events]
  );

  const bookmarkIds = useBookmarkStore((s) => s.ids);
  const toggleBookmark = useBookmarkStore((s) => s.toggle);
  const registrations = useRegistrationStore((s) => s.registrations);
  const registration = event ? registrations.find((r) => r.eventId === event.id) : undefined;

  // Event-detail keyboard shortcuts: B toggles bookmark, Backspace goes back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!event) return;
      if (e.key.toLowerCase() === "b") {
        toggleBookmark(event.id);
        e.preventDefault();
      } else if (e.key === "Backspace") {
        navigate(-1);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [event, toggleBookmark, navigate]);

  // Conflicts against everything on the user's radar (bookmarked + registered).
  const conflicts = useMemo(() => {
    if (!event) return [];
    const ids = new Set([...bookmarkIds, ...registrations.map((r) => r.eventId)]);
    const others = [...ids]
      .map((id) => byId.get(id))
      .filter((e): e is NonNullable<typeof e> => !!e);
    return conflictsWith(event, others);
  }, [event, bookmarkIds, registrations, byId]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="h-6 w-32 animate-pulse rounded bg-surface-raised" />
        <div className="mt-6 h-10 w-3/4 animate-pulse rounded bg-surface-raised" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-surface-raised" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<SparkleIcon width={24} height={24} aria-hidden="true" />}
          title="Event not found"
          message="This event may have been removed, or the link is incorrect."
          action={
            <Link to="/" className="btn-primary">
              ← Back to Events
            </Link>
          }
        />
      </div>
    );
  }

  const reg = event.currentRegistrations;
  const cap = event.maxCapacity;
  const rel = relativeLabel(event.startTime);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in px-4 py-8 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-content-muted">
        <Link to="/" className="hover:text-content">
          Feed
        </Link>
        <span aria-hidden="true" className="text-content-faint">
          ›
        </span>
        <Link
          to={`/?cat=${encodeURIComponent(event.category)}`}
          className="hover:text-content"
        >
          {event.category}
        </Link>
        <span aria-hidden="true" className="text-content-faint">
          ›
        </span>
        <span className="truncate text-content" aria-current="page">
          {event.title}
        </span>
      </nav>

      <button
        type="button"
        onClick={() => navigate(-1)}
        aria-label="Go back to the previous page"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-content-muted transition-colors hover:text-content"
      >
        <ArrowLeftIcon width={16} height={16} aria-hidden="true" />
        Back to feed
      </button>

      <article>
        {/* Header */}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={event.category} />
          {event.isCancelled && (
            <span className="inline-flex items-center rounded-full bg-rose-500/12 px-2.5 py-0.5 text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-500/25 dark:text-rose-300">
              Cancelled
            </span>
          )}
          {event.requiresTicket && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2.5 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-inset ring-amber-500/25 dark:text-amber-300">
              <TicketIcon width={12} height={12} /> Ticketed
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {event.title}
        </h1>
        <p className="mt-1.5 text-sm text-content-muted">
          Hosted by <span className="font-medium text-content">{event.organizer}</span>
        </p>

        {conflicts.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            ⚠️ Conflicts with{" "}
            {conflicts.map((c, i) => (
              <span key={c.id}>
                {i > 0 && ", "}
                <Link
                  to={`/event/${encodeURIComponent(c.id)}`}
                  className="font-semibold underline decoration-amber-500/50 hover:decoration-amber-500"
                >
                  {c.title}
                </Link>
                {c.startTime !== null && (
                  <span className="text-amber-600/80 dark:text-amber-400/80">
                    {" "}
                    at {formatTime(c.startTime)}
                  </span>
                )}
              </span>
            ))}{" "}
            in your saved or registered events.
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <RegisterButton event={event} variant="full" />
          <BookmarkButton id={event.id} title={event.title} variant="labelled" />
          <ShareButton event={event} variant="labelled" />
          {event.startTime !== null && (
            <button
              type="button"
              onClick={() => exportEventsICS([event], "event.ics")}
              className="btn-ghost"
            >
              <DownloadIcon width={16} height={16} />
              Add to calendar
            </button>
          )}
          {event.contactEmail && (
            <a href={`mailto:${event.contactEmail}`} className="btn-ghost">
              <MailIcon width={16} height={16} />
              Contact
            </a>
          )}
        </div>

        {/* Registered confirmation + personal notes */}
        {registration && (
          <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ✓ You're registered
            </p>
            <p className="mt-0.5 text-xs text-content-muted">
              Registered on {formatDateShort(Date.parse(registration.registeredAt))}
            </p>
            <PersonalNotes eventId={event.id} />
          </div>
        )}

        {/* Who else is going (from the dataset's registration count) */}
        {event.currentRegistrations !== null && (
          <p className="mt-4 text-sm text-content-muted">
            <span aria-hidden="true">👥</span>{" "}
            <span className="font-semibold text-content">
              {event.currentRegistrations.toLocaleString()}
            </span>{" "}
            {event.currentRegistrations === 1 ? "person" : "people"} registered for this event.
          </p>
        )}

        {/* Key facts grid */}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <Fact icon={<CalendarIcon width={18} height={18} />} label="Date & time">
            {event.startTime !== null ? (
              <>
                {formatDateTime(event.startTime)}
                {event.endTime !== null && event.endTime > event.startTime && (
                  <span className="text-content-muted">
                    {" → "}
                    {formatDateTime(event.endTime)}
                  </span>
                )}
                {rel && <span className="ml-2 text-xs font-medium text-brand">{rel}</span>}
              </>
            ) : event.fuzzyDate ? (
              <span className="text-content-muted">{event.fuzzyDate}</span>
            ) : (
              <span className="text-content-faint">To be announced</span>
            )}
          </Fact>

          <Fact icon={<MapPinIcon width={18} height={18} aria-hidden="true" />} label="Venue">
            {event.location ? (
              <a
                href={
                  event.location.coordinates
                    ? `https://www.google.com/maps/search/?api=1&query=${event.location.coordinates.lat},${event.location.coordinates.lng}`
                    : `https://www.google.com/maps/search/${encodeURIComponent(
                        `${event.location.building ?? event.location.label} RVCE Bangalore`
                      )}`
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-content hover:text-brand hover:underline"
              >
                {event.location.label}
                <ExternalIcon width={12} height={12} aria-hidden="true" className="text-brand" />
              </a>
            ) : (
              <span className="text-content-faint">Not available</span>
            )}
          </Fact>

          <Fact icon={<UsersIcon width={18} height={18} />} label="Registrations">
            {cap !== null && cap > 0 && reg !== null ? (
              <RegistrationBar registrations={reg} capacity={cap} variant="detail" />
            ) : reg !== null ? (
              <span>{reg.toLocaleString()} registered</span>
            ) : (
              <span className="text-content-faint">Not available</span>
            )}
          </Fact>

          <Fact icon={<MailIcon width={18} height={18} />} label="Contact">
            {event.contactEmail ? (
              <a href={`mailto:${event.contactEmail}`} className="text-brand hover:underline">
                {event.contactEmail}
              </a>
            ) : (
              <span className="text-content-faint">Not available</span>
            )}
          </Fact>
        </div>

        {/* Description */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-content-faint">
            About this event
          </h2>
          {event.description ? (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-content-muted">
              {event.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-content-faint">No description provided.</p>
          )}
        </section>

        {/* Tags */}
        {event.tags.length > 0 && (
          <section className="mt-7">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-content-faint">
              <TagIcon width={14} height={14} /> Tags
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {event.tags.map((t) => (
                <Link
                  key={t}
                  to={`/?tag=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border bg-surface-raised px-3 py-1 text-xs font-medium text-content-muted transition-colors hover:border-brand/50 hover:text-content"
                >
                  {t}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Socials */}
        {event.socials && (event.socials.instagram || event.socials.linkedin) && (
          <section className="mt-7">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-content-faint">
              Organizer socials
            </h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {event.socials.instagram && (
                <a
                  href={`https://instagram.com/${event.socials.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  <InstagramIcon width={16} height={16} />
                  {event.socials.instagram}
                </a>
              )}
              {event.socials.linkedin && (
                <a
                  href={`https://linkedin.com/company/${event.socials.linkedin}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost"
                >
                  <LinkedinIcon width={16} height={16} />
                  {event.socials.linkedin}
                </a>
              )}
            </div>
          </section>
        )}
      </article>

      {/* Similar events — same club or category, horizontally scrollable */}
      {related.length > 0 && (
        <section className="mt-12 border-t border-border pt-8">
          <h2 className="mb-4 text-lg font-semibold text-content">Similar events</h2>
          <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
            {related.slice(0, 4).map((e) => (
              <div key={e.id} className="w-72 shrink-0 snap-start">
                <EventCard event={e} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface flex gap-3 p-4">
      <span className="mt-0.5 text-content-faint">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-content-faint">{label}</p>
        <div className="mt-1 text-sm text-content">{children}</div>
      </div>
    </div>
  );
}
