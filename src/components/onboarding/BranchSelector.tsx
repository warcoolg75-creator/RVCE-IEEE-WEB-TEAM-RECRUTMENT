import { BRANCHES, BRANCH_EMOJI } from "@/utils/branchRelevance";
import { CheckIcon } from "@/components/icons";

/**
 * Selectable grid of the 16 RVCE branches (single-select). Used in onboarding
 * step 2 and the edit-profile modal.
 */
export function BranchSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (branch: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
      role="radiogroup"
      aria-label="Select your branch"
    >
      {BRANCHES.map((branch) => {
        const selected = value === branch;
        return (
          <button
            key={branch}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(branch)}
            className={`relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
              selected
                ? "border-brand bg-brand-subtle ring-1 ring-brand"
                : "border-border bg-surface hover:border-brand/40 hover:bg-surface-subtle"
            }`}
          >
            {selected && (
              <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-brand text-brand-fg">
                <CheckIcon width={11} height={11} strokeWidth={3} aria-hidden="true" />
              </span>
            )}
            <span className="text-xl" aria-hidden="true">
              {BRANCH_EMOJI[branch] ?? "🎓"}
            </span>
            <span className={`text-xs font-medium leading-tight ${selected ? "text-content" : "text-content-muted"}`}>
              {branch}
            </span>
          </button>
        );
      })}
    </div>
  );
}
