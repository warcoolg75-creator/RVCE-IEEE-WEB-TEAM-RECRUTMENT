// One-off: rasterize the favicon SVG into the PWA PNG icons.
// Run with: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "favicon.svg"));

for (const size of [192, 512]) {
  await sharp(svg, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 79, g: 70, b: 229, alpha: 1 } })
    .png()
    .toFile(join(root, "public", `pwa-${size}x${size}.png`));
  console.log(`wrote public/pwa-${size}x${size}.png`);
}

// Maskable icon: same art on a full indigo background with padding.
await sharp(svg, { density: 384 })
  .resize(410, 410, { fit: "contain", background: { r: 99, g: 102, b: 241, alpha: 1 } })
  .extend({ top: 51, bottom: 51, left: 51, right: 51, background: { r: 99, g: 102, b: 241, alpha: 1 } })
  .png()
  .toFile(join(root, "public", "pwa-maskable-512x512.png"));
console.log("wrote public/pwa-maskable-512x512.png");
