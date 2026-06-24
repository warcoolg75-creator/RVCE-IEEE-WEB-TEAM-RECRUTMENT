import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format } from "date-fns";
import { useProfileStore, useActiveProfile } from "@/store/profileStore";
import { useBookmarkStore } from "@/store/bookmarks";
import { useRegistrationStore } from "@/store/registrationStore";
import { toast } from "@/store/toast";
import { exportUserData } from "@/utils/profileExport";
import { BRANCHES, BRANCH_EMOJI } from "@/utils/branchRelevance";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { EditProfileModal } from "./EditProfileModal";
import { ChevronDownIcon } from "@/components/icons";

/** Header avatar + profile dropdown menu (self-contained). */
export function ProfileDropdown() {
  const profile = useActiveProfile();
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const switchProfile = useProfileStore((s) => s.switchProfile);
  const signOut = useProfileStore((s) => s.signOut);
  const clearProfile = useProfileStore((s) => s.clearProfile);
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.activeId);
  const bookmarkCount = useBookmarkStore((s) => s.ids.length);
  const regCount = useRegistrationStore((s) => s.registrations.length);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [switchAccount, setSwitchAccount] = useState(false);
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

  if (!profile) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Profile menu for ${profile.name}`}
        className="rounded-full ring-offset-2 ring-offset-surface-subtle transition hover:ring-2 hover:ring-brand/40"
      >
        <ProfileAvatar name={profile.name} color={profile.avatarColor} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl animate-fade-in-fast"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <ProfileAvatar name={profile.name} color={profile.avatarColor} size={44} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-content">{profile.name}</p>
              <p className="truncate text-xs text-content-muted">
                {profile.branch ? `${BRANCH_EMOJI[profile.branch] ?? "🎓"} ${profile.branch}` : "No branch set"}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1 px-4 py-3 text-xs text-content-muted">
            {profile.usn && <p>USN · {profile.usn}</p>}
            {profile.email && <p className="truncate">{profile.email}</p>}
            <p className="text-content">
              📋 {regCount} registered · 🔖 {bookmarkCount} bookmarked
            </p>
            <p className="text-content-faint">Since {format(Date.parse(profile.createdAt), "d MMM yyyy")}</p>
          </div>

          {/* Quick switch branch */}
          <div className="border-t border-border px-4 py-2.5">
            <label className="block text-[11px] font-medium uppercase tracking-wide text-content-faint">
              Switch branch
            </label>
            <div className="relative mt-1">
              <select
                value={profile.branch ?? ""}
                onChange={(e) => {
                  updateProfile({ branch: e.target.value || null });
                  toast.success("Branch updated ✓");
                }}
                aria-label="Switch branch"
                className="input-base cursor-pointer appearance-none py-1.5 pr-8 text-sm"
              >
                <option value="">All branches</option>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
              <ChevronDownIcon width={14} height={14} aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-border p-1.5">
            <MenuItem label="Edit Profile" onClick={() => { setEditing(true); setOpen(false); }} />
            <MenuItem label="Export My Data" onClick={() => { exportUserData(profile); toast.success("Data exported ✓"); }} />
            <MenuItem label="Switch Account" onClick={() => setSwitchAccount((v) => !v)} />
          </div>

          {switchAccount && (
            <div className="border-t border-border px-3 py-2">
              <ProfileSwitcher
                profiles={profiles}
                activeId={activeId}
                onSelect={(id) => { switchProfile(id); setOpen(false); toast.success("Switched profile"); }}
                onCreateNew={() => { signOut(); setOpen(false); }}
              />
            </div>
          )}

          <div className="border-t border-border p-1.5">
            <MenuItem label="Sign Out" onClick={() => setConfirmSignOut(true)} />
            <MenuItem
              label="Clear All Data & Reset"
              danger
              onClick={() => setConfirmClear(true)}
            />
          </div>
        </div>
      )}

      {editing && <EditProfileModal profile={profile} onClose={() => setEditing(false)} />}

      {confirmSignOut && (
        <ConfirmModal
          title={`Sign out of ${profile.name}'s account?`}
          body="Your data stays on this device — you can sign back in anytime."
          confirmLabel="Sign Out"
          onConfirm={() => { signOut(); setConfirmSignOut(false); setOpen(false); }}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}

      {confirmClear && (
        <ConfirmModal
          title="Clear all data & reset?"
          body="This permanently deletes your profile, bookmarks, registrations and notes from this device. This can't be undone."
          confirmLabel="Delete Everything"
          danger
          onConfirm={() => { clearProfile(); setConfirmClear(false); setOpen(false); toast.info("All data cleared"); }}
          onCancel={() => setConfirmClear(false)}
        />
      )}
    </div>
  );
}

function MenuItem({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`block w-full rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface-subtle ${
        danger ? "text-rose-600 dark:text-rose-400" : "text-content"
      }`}
    >
      {label}
    </button>
  );
}

function ConfirmModal({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm animate-slide-up rounded-2xl border border-border bg-surface-raised p-5 shadow-xl">
        <h2 className="text-base font-semibold text-content">{title}</h2>
        <p className="mt-1.5 text-sm text-content-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`btn px-4 py-2 text-white ${danger ? "bg-rose-500" : "bg-brand"} hover:opacity-90`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
