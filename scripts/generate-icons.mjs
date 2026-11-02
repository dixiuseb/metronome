import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
const SPLASH_SVG_PATH = path.join(process.cwd(), "public", "splash", "splash.svg");
const IOS_SPLASH_DIR = path.join(
  process.cwd(),
  "ios/App/App/Assets.xcassets/Splash.imageset",
);

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

const IOS_SPLASH_FILES = [
  "splash-2732x2732.png",
  "splash-2732x2732-1.png",
  "splash-2732x2732-2.png",
];

await mkdir(OUT_DIR, { recursive: true });
await mkdir(path.dirname(SPLASH_SVG_PATH), { recursive: true });

for (const { name, size } of SIZES) {
  const png = await sharp(Buffer.from(ICON_SVG)).resize(size, size).png().toBuffer();
  await writeFile(path.join(OUT_DIR, name), png);
}

await writeFile(path.join(OUT_DIR, "icon.svg"), ICON_SVG.trim());

let splashGenerated = false;
try {
  await access(SPLASH_SVG_PATH);
  await access(IOS_SPLASH_DIR);
  const splashPng = await sharp(SPLASH_SVG_PATH).png().toBuffer();
  for (const name of IOS_SPLASH_FILES) {
    await writeFile(path.join(IOS_SPLASH_DIR, name), splashPng);
  }
  splashGenerated = true;
} catch {
  /* ios project or splash source not present — skip */
}

console.log(`Generated ${SIZES.length} PNG icons in public/icons/`);
if (splashGenerated) {
  console.log("Generated iOS splash images in ios/App/App/Assets.xcassets/Splash.imageset/");
}
