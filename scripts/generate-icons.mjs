import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT_DIR = path.join(process.cwd(), "public", "icons");
const ICON_SVG_PATH = path.join(OUT_DIR, "icon.svg");
const SPLASH_SVG_PATH = path.join(process.cwd(), "public", "splash", "splash.svg");
const IOS_SPLASH_DIR = path.join(
  process.cwd(),
  "ios/App/App/Assets.xcassets/Splash.imageset",
);
const IOS_APP_ICON_PATH = path.join(
  process.cwd(),
  "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
);

const DEFAULT_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0e0e0f"/>
  <circle cx="256" cy="256" r="112" fill="#e8c97a"/>
  <circle cx="256" cy="256" r="72" fill="#0e0e0f" opacity="0.35"/>
</svg>`;

async function readIconSvg() {
  try {
    const { readFile } = await import("node:fs/promises");
    return (await readFile(ICON_SVG_PATH, "utf8")).trim();
  } catch {
    return DEFAULT_ICON_SVG.trim();
  }
}

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

const iconSvg = await readIconSvg();

for (const { name, size } of SIZES) {
  const png = await sharp(Buffer.from(iconSvg)).resize(size, size).png().toBuffer();
  await writeFile(path.join(OUT_DIR, name), png);
}

let iosAppIconGenerated = false;
try {
  await access(path.dirname(IOS_APP_ICON_PATH));
  const appIconPng = await sharp(Buffer.from(iconSvg)).resize(1024, 1024).png().toBuffer();
  await writeFile(IOS_APP_ICON_PATH, appIconPng);
  iosAppIconGenerated = true;
} catch {
  /* ios project not present — skip */
}

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
if (iosAppIconGenerated) {
  console.log(
    "Generated 1024×1024 App Store icon at ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
  );
}
if (splashGenerated) {
  console.log("Generated iOS splash images in ios/App/App/Assets.xcassets/Splash.imageset/");
}
