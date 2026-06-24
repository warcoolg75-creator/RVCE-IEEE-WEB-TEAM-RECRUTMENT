import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";

const DISMISS_KEY = "rvce-install-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Bottom "Install App" banner. Appears only when the browser fires
 * `beforeinstallprompt` and the user hasn't dismissed it before (persisted in
 * localStorage).
 */
export function InstallBanner() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    dismiss();
  };

  if (!visible || !promptEvent) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] flex justify-center px-4 pb-4 sm:hidden">
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3 shadow-lg shadow-black/20 animate-slide-up">
        <span className="text-xl" aria-hidden="true">
          📱
        </span>
        <p className="flex-1 text-sm text-content">Install RVCE Events for quick access</p>
        <button type="button" onClick={install} className="btn-primary px-3 py-1.5 text-xs">
          Install
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="grid h-8 w-8 place-items-center rounded-full text-content-faint hover:bg-surface-subtle hover:text-content"
        >
          <CloseIcon width={16} height={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
