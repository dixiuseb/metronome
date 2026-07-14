# Pocket Click

**Pocket Click** is a straightforward metronome for practice: steady clicks, simple controls, and a dark “gear on the bench” look. No ads, no sign-up, no in-app purchases, and no fluff.

Whether you drum, play another instrument, or just need a reliable click track, the idea is **one focused screen**—fast tempo changes, tap tempo, a clear pulse you can actually use with headphones.

## What you can do today

- Adjust **tempo** (BPM)—drag on the large number or use ±1 / ±10
- **Tap tempo**—tap a few beats to lock in speed
- Set **beats per bar** (2–8)—beat one is accented so phrases stay anchored
- **Play / pause** with an obvious primary control
- **Practice timer** (optional)—drag the clock to set a duration (0:00 = off); counts down and stops when time's up
- **Per-beat accents**—tap the dots to cycle normal / medium / strong
- **Install as a PWA**—add to home screen after deploying over HTTPS (see below)

## Install on your phone (PWA)

1. Deploy to a host with HTTPS (e.g. [Vercel](https://vercel.com)—connect this repo and deploy).
2. Open the URL on your phone.
3. **iOS Safari:** Share → **Add to Home Screen**
4. **Android Chrome:** Menu → **Install app** or **Add to Home screen**

The app runs standalone (no browser chrome), caches static assets for offline load, and uses the same Web Audio engine as the desktop site.

## Try it locally

Requirements: [Node.js](https://nodejs.org/) (matching what this project expects—typically the current LTS).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. For a production-style build:

```bash
npm run build
npm start
```

## Privacy & data

Built for practice, not harvesting data. No account is required for the app vision; keep it that way as features grow unless you consciously choose otherwise.

## For developers & contributors

- **[CAPACITOR.md](CAPACITOR.md)** — Native iOS build, sync, and simulator workflow
- **[spec.md](spec.md)** — Stack, codebase layout, product guardrails you should follow when implementing, and technical specs for planned features
- **[roadmap.md](roadmap.md)** — What’s shipped vs next, MVP scope, stretch ideas, suggested build order

The working title **“Pocket Click”** may change before any public launch. The footer line—“No ads. No BS.”—captures what this should stay.
