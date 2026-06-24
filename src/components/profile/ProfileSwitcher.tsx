import type { UserProfile } from "@/store/profileStore";
import { BRANCH_EMOJI } from "@/utils/branchRelevance";
import { ProfileAvatar } from "./ProfileAvatar";

/**
 * Reusable list of stored profiles. Used by the sign-in picker and the
 * "Switch Account" menu. Clicking a profile selects it; "Add another profile"
 * starts a fresh onboarding flow.
 */
export function ProfileSwitcher({
  profiles,
  activeId,
  onSelect,
  onCreateNew,
}: {
  profiles: UserProfile[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
}) {
  return (
    <div className="space-y-2">
      {profiles.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onSelect(p.id)}
          className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
            p.id === activeId
              ? "border-brand bg-brand-subtle"
              : "border-border hover:border-brand/40 hover:bg-surface-subtle"
          }`}
        >
          <ProfileAvatar name={p.name} color={p.avatarColor} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-content">{p.name}</span>
            <span className="block truncate text-xs text-content-muted">
              {p.branch ? `${BRANCH_EMOJI[p.branch] ?? "🎓"} ${p.branch}` : "No branch set"}
            </span>
          </span>
        </button>
      ))}
      <button
        type="button"
        onClick={onCreateNew}
        className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border p-2.5 text-left text-sm font-medium text-content-muted hover:border-brand/40 hover:text-content"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-subtle text-lg">+</span>
        Add another profile
      </button>
    </div>
  );
}
