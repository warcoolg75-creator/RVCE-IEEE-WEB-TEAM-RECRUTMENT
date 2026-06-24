import { useEffect, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "@/store/toast";

/**
 * Thin top banner shown while the app is offline (data is served from the
 * service-worker cache). When the connection returns, the banner disappears
 * and a subtle toast confirms the refresh.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      wasOffline.current = false;
      toast.success("Back online — data refreshed");
    }
  }, [online]);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[80] bg-amber-500 px-4 py-1.5 text-center text-xs font-semibold text-black"
    >
      📴 Offline — showing cached data
    </div>
  );
}
