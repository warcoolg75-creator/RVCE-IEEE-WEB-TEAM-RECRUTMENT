import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { DataProvider } from "@/store/DataContext";
import { useGlobalShortcuts } from "@/hooks/useKeyboardNav";
import { useProfileStore, useShouldOnboard } from "@/store/profileStore";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/Toaster";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { InstallBanner } from "@/components/install/InstallBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoadingScreen } from "@/components/LoadingScreen";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { WelcomeBanner } from "@/components/welcome/WelcomeBanner";
import { EventFeed } from "@/pages/EventFeed";
import { EventDetail } from "@/pages/EventDetail";
import { Bookmarks } from "@/pages/Bookmarks";
import { SchedulePage } from "@/pages/SchedulePage";
import { DebugPage } from "@/pages/DebugPage";
import { CalendarView } from "@/components/calendar/CalendarView";

export default function App() {
  useGlobalShortcuts();
  const location = useLocation();
  const shouldOnboard = useShouldOnboard();
  const activeId = useProfileStore((s) => s.activeId);
  const touchVisit = useProfileStore((s) => s.touchVisit);

  // Refresh last-visit timestamp once per app load (after WelcomeBanner has
  // snapshotted the previous value during its own mount).
  useEffect(() => {
    if (activeId && !shouldOnboard) touchVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DataProvider>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <OfflineBanner />
      <div className="flex min-h-screen flex-col">
        <Navbar />
        {!shouldOnboard && <WelcomeBanner />}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {/* Fade between pages on navigation */}
          <div key={location.pathname} className="animate-fade-in-fast">
            <Routes location={location}>
              <Route path="/" element={<EventFeed />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/debug" element={<DebugPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
        <footer className="border-t border-border py-6 text-center text-xs text-content-faint">
          RVCE Campus Events
        </footer>
      </div>
      <Toaster />
      <ShortcutsModal />
      <InstallBanner />
      <LoadingScreen />
      {shouldOnboard && <OnboardingModal />}
    </DataProvider>
  );
}
