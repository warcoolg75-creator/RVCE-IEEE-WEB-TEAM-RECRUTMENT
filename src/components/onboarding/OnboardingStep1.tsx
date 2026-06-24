import { SparkleIcon } from "@/components/icons";

/** Step 1 of onboarding: name (required) + optional USN / email. */
export function OnboardingStep1({
  name,
  usn,
  email,
  onName,
  onUsn,
  onEmail,
  onContinue,
}: {
  name: string;
  usn: string;
  email: string;
  onName: (v: string) => void;
  onUsn: (v: string) => void;
  onEmail: (v: string) => void;
  onContinue: () => void;
}) {
  const valid = name.trim().length >= 2;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue();
      }}
    >
      <div className="mb-5 flex flex-col items-center text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand text-brand-fg shadow-lg shadow-brand/30">
          <SparkleIcon width={28} height={28} aria-hidden="true" />
        </span>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand">Step 1 of 2</p>
        <h2 className="mt-1 text-xl font-bold tracking-tight text-content">
          Welcome to RVCE Campus Events
        </h2>
        <p className="mt-1 text-sm text-content-muted">Let's personalize your experience</p>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content">What should we call you?</span>
          <input
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Your name"
            autoFocus
            aria-label="Your name"
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content">
            University Serial Number <span className="text-content-faint">(optional)</span>
          </span>
          <input
            type="text"
            value={usn}
            onChange={(e) => onUsn(e.target.value)}
            placeholder="1RV22ME001"
            aria-label="University Serial Number"
            className="input-base"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-content">
            Email <span className="text-content-faint">(optional)</span>
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmail(e.target.value)}
            placeholder="name@rvce.edu.in"
            aria-label="Email"
            className="input-base"
          />
        </label>
      </div>

      <button type="submit" disabled={!valid} className="btn-primary mt-5 w-full py-2.5">
        Continue →
      </button>
      {!valid && name.length > 0 && (
        <p className="mt-2 text-center text-xs text-content-faint">
          Please enter at least 2 characters.
        </p>
      )}
    </form>
  );
}
