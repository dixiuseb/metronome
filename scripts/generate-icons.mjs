import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0e0e0f"/>
  <circle cx="256" cy="256" r="112" fill="#e8c97a"/>
  <circle cx="256" cy="256" r="72" fill="#0e0e0f" opacity="0.35"/>
</svg>
`;

const SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

await mkdir(OUT_DIR, { recursive: true });

for (const { name, size } of SIZES) {
  const png = await sharp(Buffer.from(ICON_SVG)).resize(size, size).png().toBuffer();
  await writeFile(path.join(OUT_DIR, name), png);
}

await writeFile(
  path.join(OUT_DIR, "icon.svg"),
  ICON_SVG.trim(),
);

console.log(`Generated ${SIZES.length} PNG icons in public/icons/`);
