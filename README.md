# RVCE-IEEE-WEB-TEAM-RECRUTMENT

A high-performance single-page application for browsing, exploring, and managing 11,000+ campus events built with React, TypeScript, and Vite.

## How to Run Locally

### Prerequisites
- Node.js (v18 or higher)
- npm

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/warcoolg75-creator/RVCE-IEEE-WEB-TEAM-RECRUTMENT.git
   cd RVCE-IEEE-WEB-TEAM-RECRUTMENT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   The `.env` file controls the data source:
   - For local development: `VITE_DATA_SOURCE=./events.json`
   - For remote fetch: `VITE_DATA_SOURCE=https://pub-d6db99c9b68842a5b6f527e86583f256.r2.dev/events.json`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

> Note: the service worker and offline mode are active in the production build (`npm run preview`), not during `npm run dev`.

## Data Handling

The application processes ~12,000 raw events with intentional inconsistencies — all normalization happens at runtime. The original `events.json` is never modified. Both data source modes (local file and remote URL) produce identical application behaviour.

Key data challenges handled:
- Inconsistent and missing date formats (epoch, ISO, DD/MM/YYYY, and free text) parsed into valid Date objects
- Duplicate events detected and removed
- Missing or null fields (names, descriptions, venues) handled gracefully
- Empty strings and whitespace-only values treated as missing
- Events without IDs (and colliding IDs) assigned stable generated IDs
- HTML entities and special characters decoded and sanitized
- Numbers stored as strings coerced to numbers

Visit `/debug` for a full data quality report showing exactly how the raw dataset was cleaned.

## Additional Features Built

### Core Pages
- **Event Feed** — Filterable, searchable grid with virtualized rendering for smooth performance
- **Event Detail** — Full event info with venue Google Maps link, similar events, breadcrumbs, and share options
- **Calendar View** — Monthly calendar with color-coded club events and a week view toggle
- **My Schedule** — Personal registration page with a chronological agenda layout
- **Bookmarks** — Persistent saved events with export options

### Smart Features
- **Branch Recommendations** — Select your engineering branch (all 16 RVCE departments supported); events are scored and ranked by keyword relevance to your field
- **Event Registration System** — Register/book events separately from bookmarks, with personal notes per event
- **Schedule Conflict Detection** — Warns when registered or bookmarked events overlap in time
- **User Profiles** — Onboarding flow with name, USN, and branch selection; personalized greeting, a "welcome back" banner, and persistent preferences
- **Multiple Profiles** — Switch between or add profiles on a shared device; each keeps its own bookmarks and registrations
- **Club Color System** — Each club gets a unique bright color, consistent across all views

### UX & Polish
- **Happening Now** — A hero strip at the top of the feed surfacing events happening Now / Today / This Week
- **Dark/Light Mode** with system preference detection
- **Keyboard Navigation** — press `?` for the full shortcut list (J/K to navigate, B to bookmark, S to share, `/` to search)
- **Share Events** — Copy link, WhatsApp, Twitter/X, or copy formatted details (uses the native share sheet on mobile)
- **Export** — Bookmarks and schedule exportable as .ics (Google Calendar compatible), printable PDF, or JSON
- **Offline PWA Support** — Service worker caches the app and data for offline use; installable to the home screen
- **Event Analytics Dashboard** — Collapsible insights showing trending categories, most active clubs, and monthly distribution
- **Timeline View** — Alternative vertical timeline layout grouped by date
- **Registration Progress Bars** — Visual fill indicator showing spots remaining
- **Recent Searches** — Quick access to your last searches
- **Responsive Design** — Fully functional on mobile, tablet, and desktop

### Technical Highlights
- **Runtime data normalization** of 12,000 messy records with zero preprocessing
- **Virtualized rendering** for handling large datasets without lag
- **URL-synced filters** — filter state in URL params for shareable links
- **Diacritic-insensitive search** — "cafe" matches "café"
- **Accessible** — semantic HTML, ARIA labels, skip-to-content link, keyboard navigation, WCAG AA contrast

## Tech Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router (client-side routing)
- date-fns (date handling)
- @tanstack/react-virtual (virtualized lists)
- vite-plugin-pwa (offline support)
