# Roadmap — Pocket Click

Broad intent: a dependable metronome you actually want to open at the kit—**minimal configuration**, no bloat, tight timing.

- **User introduction:** [README.md](README.md)  
- **Technical detail & feature semantics:** [spec.md](spec.md)

---

## v1 — shipped (personal-use complete)

What exists in **`src/components/Metronome.tsx`** today. This is the feature set that matters for v1:

| Status | Capability |
|:------:|-----------|
| Done | BPM 20–300; drag BPM; ±1 / ±10 |
| Done | Tap tempo (≥2 taps / 3s window) |
| Done | Beats per bar **2–8** |
| Done | **Per-beat accents** — click pips to cycle normal / medium / strong |
| Done | Four synthetic sounds (`click`, `wood`, `hi_hat`, `rim`) |
| Done | Beat pips synced to lookahead Web Audio scheduler |
| Done | Play / pause (tap left, play center, timer right) |
| Done | **Practice timer** — draggable M:SS (0:00 = off); 15s snap; pause freezes; auto-stop at zero |

**v1 is functionally complete** for intended personal use. Further feature work waits on real-device feedback unless something breaks.

---

## Next up — PWA device testing

**Goal:** Install on a phone/tablet, use at the kit, and see how it *feels* before wrapping for the store. PWA is the **validation layer**; Capacitor is the **App Store path** (see below)—not an either/or fork.

| Priority | Task | Status |
|:--------:|------|:------:|
| P0 | **Web app manifest** — name, theme colors, `standalone` display | Done |
| P0 | **App icons** — 192 / 512 / Apple touch (generated via `npm run generate-icons`) | Done |
| P0 | **Service worker** — `@serwist/turbopack`; precache + offline fallback at `/~offline` | Done |
| P0 | **Deploy** a stable HTTPS URL (e.g. Vercel) so mobile install and Web Audio behave like production | **You** |
| P1 | **iOS Safari smoke test** — use device checklist below | Pending |
| P1 | **Offline shell** — Serwist precaches static assets; metronome audio is synthesized in-browser | Done |
| P2 | **`apple-mobile-web-app-*` meta** — via Next `metadata.appleWebApp` + theme color | Done |

### Install locally (production build)

```bash
npm run build
npm start
```

Open on your phone over **HTTPS** (localhost alone won’t install on iOS). For local device testing, use a tunnel (e.g. `ngrok`) or deploy first.

**Add to Home Screen:** Safari → Share → Add to Home Screen. Android Chrome → menu → Install app / Add to Home screen.

### Device test checklist (use this when deployed)

- [ ] Add to home screen (iOS + Android if available)
- [ ] Play/pause from cold start; no double downbeat
- [ ] Drag BPM and timer with a finger
- [ ] Tap tempo while playing
- [ ] Practice timer: pause mid-run, adjust, resume; auto-stop at zero
- [ ] Per-beat accent toggles audible and visible
- [ ] Beats-per-bar change while stopped
- [ ] Screen layout: no scroll, controls reachable one-handed

---

## v1.x — polish (before Capacitor)

**Order:** finish any known UI fixes here, keep testing on the PWA build, then start Capacitor. Same web UI ships inside the native wrapper—polish the web app first so you’re not chasing layout issues through Xcode rebuilds.

Informed by **how it feels in use**, not speculation. Candidate bucket—pick only what real friction justifies:

| Area | Examples |
|------|-----------|
| **Design / UX** | Typography (`next/font`), spacing, touch targets, color tweaks, idle vs playing states; **known UI fix in flight** |
| **Ergonomics** | Spacebar play/pause, master volume |
| **Quality** | Strict Mode / engine edge cases already handled; any Safari-specific fixes from checklist |
| **iOS audio (PWA)** | Silent-switch workaround via media channel; replace with native `AVAudioSession` in Capacitor |

No new feature categories here unless device testing exposes a clear gap.

---

## App Store — Capacitor (after v1.x + device sign-off)

**Goal:** Ship Pocket Click on the App Store (and optionally Play Store) using **Capacitor** to wrap the existing Next.js app—not a rewrite.

| Phase | Task |
|-------|------|
| Scaffold | `@capacitor/core`, iOS/Android projects, static export or bundled web assets |
| Native audio | iOS **playback** audio session so clicks work with the hardware mute switch (replaces PWA silent-loop hack) |
| Store polish | Splash, privacy policy, TestFlight → App Store review |
| Android | Same wrapper; no hardware mute switch issue, but shared packaging path |

PWA work (manifest, icons, Serwist) is **not throwaway**—icons and offline behavior carry over; the service worker is web/PWA-specific and may be simplified or dropped in the native shell.

---

## v2 — deferred features

Explicitly **not** v1 or the store release. Revisit only if personal use still wants them after living with the shipped app.

| Feature | Notes |
|---------|--------|
| **Tempo progression** | Start/end BPM, one pacing model—no program builder (see `spec.md`) |
| **Subdivisions** | 8ths, triplets—display and/or clicks |
| **Pattern presets** | Rock / hat patterns—scheduler complexity |

---

## Explicit non-roadmap traps

| Avoid | Reason |
|--------|--------|
| Multi-stage programmable routines + save UX | Diverts into planner product |
| Streak/session analytics first-class UX | Signals growth metrics over practice tools |
| Social / leaderboard surfaces | Explicitly orthogonal goal |

Periodic review: Does this still feel like gear on a bench? If not—cut scope rather than layering motivation chrome.
