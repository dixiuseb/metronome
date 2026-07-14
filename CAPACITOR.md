# Capacitor — Pocket Click

Native iOS shell for the App Store. The web app is built as a **static export** and copied into the Capacitor `ios/` project.

## Prerequisites

- macOS with **Xcode** installed
- Apple Developer account (only needed for device deploy / TestFlight / App Store)

## Build & run on simulator

```bash
npm run cap:run:ios
```

Or step by step:

```bash
npm run build:capacitor   # static export → out/
npx cap sync ios          # copy web assets into ios/
npm run cap:ios           # open Xcode
```

In Xcode: pick a simulator → **Run** (▶).

## After web changes

Always rebuild before syncing:

```bash
npm run build:capacitor && npx cap sync ios
```

## Web vs native builds

| Script | Output | Use |
|--------|--------|-----|
| `npm run build` | `.next/` (SSR) | Vercel / PWA deploy |
| `npm run build:capacitor` | `out/` (static) | Capacitor native shell |

`CAPACITOR_BUILD=1` enables `output: 'export'` in `next.config.ts`. PWA service worker registration is skipped automatically inside the native app (`Capacitor.isNativePlatform()`).

## Config

- **`capacitor.config.ts`** — app id `com.pocketclick.app`, web dir `out/`
- Change **`appId`** before App Store submission if you use a different bundle identifier

## Next steps (see `roadmap.md`)

1. Native iOS audio session (mute switch)
2. Splash screen + app icons in Xcode
3. Privacy policy + About screen
4. TestFlight → App Store
