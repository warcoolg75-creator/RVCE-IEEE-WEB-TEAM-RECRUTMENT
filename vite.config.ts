import { defineConfig, loadEnv, type ProxyOptions } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

/**
 * The path the app uses to fetch a *remote* dataset. When VITE_DATA_SOURCE is
 * an https URL we proxy it through the dev/preview server under this path so
 * the browser makes a same-origin request — this sidesteps the fact that the
 * R2 bucket doesn't send CORS headers, and lets remote mode behave identically
 * to local mode. Kept in sync with src/utils/loadEvents.ts.
 */
const REMOTE_PROXY_PATH = "/__events-data";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const dataSource = (env.VITE_DATA_SOURCE || "./events.json").trim();
  const isRemote = /^https?:\/\//i.test(dataSource);

  let proxy: Record<string, ProxyOptions> | undefined;
  if (isRemote) {
    const url = new URL(dataSource);
    proxy = {
      [REMOTE_PROXY_PATH]: {
        target: url.origin,
        changeOrigin: true,
        secure: true,
        rewrite: () => url.pathname + url.search,
      },
    };
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "pwa-192x192.png", "pwa-512x512.png"],
        manifest: {
          name: "RVCE Campus Events",
          short_name: "RVCE Events",
          description: "Browse, search and bookmark 12,000 RVCE campus events.",
          start_url: "/",
          display: "standalone",
          theme_color: "#6366f1",
          background_color: "#0f172a",
          icons: [
            { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
            {
              src: "pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          // Cache the app shell + static assets.
          globPatterns: ["**/*.{js,css,html,svg,png,woff,woff2}"],
          maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
          runtimeCaching: [
            {
              // Cache the dataset (local or proxied) after first fetch.
              urlPattern: ({ url }) =>
                url.pathname.endsWith("events.json") || url.pathname === REMOTE_PROXY_PATH,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "events-data",
                expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
              handler: "StaleWhileRevalidate",
              options: { cacheName: "google-fonts-stylesheets" },
            },
            {
              urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: { proxy },
    preview: { proxy },
  };
});
