import { NavLink, Link } from "react-router-dom";
import { useBookmarkStore } from "@/store/bookmarks";
import { useUIStore } from "@/store/ui";
import { useRegistrationStore } from "@/store/registrationStore";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileDropdown } from "./profile/ProfileDropdown";
import { BookmarkIcon, SparkleIcon, CalendarIcon, TicketIcon, GridIcon } from "./icons";

export function Navbar() {
  const count = useBookmarkStore((s) => s.ids.length);
  const regCount = useRegistrationStore((s) => s.registrations.length);
  const openHelp = useUIStore((s) => s.setHelpOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-subtle/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-brand-fg">
            <SparkleIcon width={18} height={18} />
          </span>
          <span className="hidden text-[15px] sm:inline">
            RVCE <span className="text-content-muted">Campus Events</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1.5" aria-label="Primary">
          <TabLink to="/" label="Feed" icon={<GridIcon width={16} height={16} />} />
          <TabLink to="/calendar" label="Calendar" icon={<CalendarIcon width={16} height={16} />} />
          <TabLink
            to="/schedule"
            label="My Schedule"
            count={regCount}
            icon={<TicketIcon width={16} height={16} />}
          />
          <TabLink
            to="/bookmarks"
            label="Bookmarks"
            count={count}
            icon={<BookmarkIcon width={16} height={16} />}
          />
          <div className="mx-1 h-6 w-px bg-border" aria-hidden />
          <button
            type="button"
            onClick={() => openHelp(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="hidden h-9 w-9 place-items-center rounded-full border border-border text-content-muted transition-colors hover:bg-surface hover:text-content sm:grid"
          >
            <span aria-hidden className="text-base leading-none">⌨️</span>
          </button>
          <ThemeToggle />
          <ProfileDropdown />
        </nav>
      </div>
    </header>
  );
}

function TabLink({
  to,
  label,
  count,
  icon,
}: {
  to: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors sm:px-3 ${
          isActive
            ? "bg-surface text-content"
            : "text-content-muted hover:bg-surface hover:text-content"
        }`
      }
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-0.5 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-brand-fg">
          {count}
        </span>
      )}
    </NavLink>
  );
}
