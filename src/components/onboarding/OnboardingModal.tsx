import { useState } from "react";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/store/toast";
import { OnboardingStep1 } from "./OnboardingStep1";
import { OnboardingStep2 } from "./OnboardingStep2";
import { ProfileSwitcher } from "@/components/profile/ProfileSwitcher";

/**
 * Full-screen first-time setup / sign-in picker. Shown (over a blurred app)
 * whenever there's no active profile or the user has signed out.
 */
export function OnboardingModal() {
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.activeId);
  const createProfile = useProfileStore((s) => s.createProfile);
  const switchProfile = useProfileStore((s) => s.switchProfile);

  // Start on the picker if profiles exist (e.g. after sign-out), else setup.
  const [mode, setMode] = useState<"picker" | "setup">(profiles.length > 0 ? "picker" : "setup");
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [branch, setBranch] = useState<string | null>(null);

  const finish = (selectedBranch: string | null) => {
    createProfile({ name, usn, email, branch: selectedBranch });
    toast.success(
      selectedBranch
        ? `Welcome, ${name.trim()}! 👋 Events are sorted for ${selectedBranch}.`
        : `Welcome, ${name.trim()}! 👋`
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Set up your profile"
    >
      {/* blurred backdrop */}
      <div className="absolute inset-0 bg-surface-subtle/70 backdrop-blur-xl" />
      {/* soft floating gradient accents */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl border border-border bg-surface-raised p-6 shadow-2xl sm:p-8">
        {mode === "picker" ? (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-xl font-bold tracking-tight text-content">Welcome back 👋</h2>
              <p className="mt-1 text-sm text-content-muted">Choose a profile to continue</p>
            </div>
            <ProfileSwitcher
              profiles={profiles}
              activeId={activeId}
              onSelect={(id) => switchProfile(id)}
              onCreateNew={() => {
                setMode("setup");
                setStep(1);
              }}
            />
          </div>
        ) : step === 1 ? (
          <OnboardingStep1
            name={name}
            usn={usn}
            email={email}
            onName={setName}
            onUsn={setUsn}
            onEmail={setEmail}
            onContinue={() => setStep(2)}
          />
        ) : (
          <OnboardingStep2
            branch={branch}
            onBranch={setBranch}
            onBack={() => setStep(1)}
            onComplete={() => finish(branch)}
            onSkip={() => finish(null)}
          />
        )}

        {mode === "setup" && profiles.length > 0 && (
          <button
            type="button"
            onClick={() => setMode("picker")}
            className="mt-4 block w-full text-center text-xs font-medium text-content-faint hover:text-content"
          >
            ← Back to profiles
          </button>
        )}
      </div>
    </div>
  );
}
