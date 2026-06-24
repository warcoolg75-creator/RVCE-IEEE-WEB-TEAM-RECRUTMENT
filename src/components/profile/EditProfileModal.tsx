import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useProfileStore, type UserProfile } from "@/store/profileStore";
import { toast } from "@/store/toast";
import { BranchSelector } from "@/components/onboarding/BranchSelector";
import { CloseIcon } from "@/components/icons";

/** Modal to edit name / USN / email / branch. Escape-closes, traps focus. */
export function EditProfileModal({
  profile,
  onClose,
}: {
  profile: UserProfile;
  onClose: () => void;
}) {
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [name, setName] = useState(profile.name);
  const [usn, setUsn] = useState(profile.usn ?? "");
  const [email, setEmail] = useState(profile.email ?? "");
  const [branch, setBranch] = useState<string | null>(profile.branch);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab") return;
      const f = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, [tabindex]:not([tabindex="-1"])'
      );
      if (!f || f.length === 0) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    updateProfile({ name: name.trim(), usn: usn.trim() || undefined, email: email.trim() || undefined, branch });
    toast.success("Profile updated ✓");
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label="Edit profile">
      <div className="absolute inset-0 bg-black/40 animate-fade-in-fast" onClick={onClose} />
      <div ref={panelRef} className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl border border-border bg-surface-raised p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-content">Edit profile</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full hover:bg-surface">
            <CloseIcon width={18} height={18} aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-content">Name</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-base" aria-label="Name" autoFocus />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">USN</span>
              <input type="text" value={usn} onChange={(e) => setUsn(e.target.value)} placeholder="1RV22ME001" className="input-base" aria-label="USN" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-content">Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@rvce.edu.in" className="input-base" aria-label="Email" />
            </label>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-content">Branch</span>
            <div className="max-h-[34vh] overflow-y-auto pr-1">
              <BranchSelector value={branch} onChange={setBranch} />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button type="button" onClick={save} className="btn-primary px-4 py-2">
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
