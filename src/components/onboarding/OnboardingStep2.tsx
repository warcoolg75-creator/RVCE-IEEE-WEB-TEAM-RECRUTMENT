import { BranchSelector } from "./BranchSelector";

/** Step 2 of onboarding: branch selection (or skip). */
export function OnboardingStep2({
  branch,
  onBranch,
  onBack,
  onComplete,
  onSkip,
}: {
  branch: string | null;
  onBranch: (b: string) => void;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Step 2 of 2</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-content">Pick your branch</h2>
        <p className="mt-1 text-sm text-content-muted">This helps us recommend relevant events</p>
      </div>

      <div className="max-h-[46vh] overflow-y-auto pr-1">
        <BranchSelector value={branch} onChange={onBranch} />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button type="button" onClick={onBack} className="btn-ghost py-2.5">
          ← Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={!branch}
          className="btn-primary flex-1 py-2.5"
        >
          Get Started 🚀
        </button>
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-3 block w-full text-center text-xs font-medium text-content-faint hover:text-content"
      >
        Skip for now
      </button>
    </div>
  );
}
