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

## Next up — PWA & device-ready demo

**Goal:** Install on a phone/tablet, use at the kit, and see how it *feels*—without Capacitor or an app store yet.

| Priority | Task |
|:--------:|------|
| P0 | **Web app manifest** (`manifest.json` / Next metadata): name, theme colors, `standalone` display |
| P0 | **App icons** — at minimum sizes needed for iOS “Add to Home Screen” and Android install |
| P0 | **Deploy** a stable HTTPS URL (e.g. Vercel) so mobile install and Web Audio behave like production |
| P1 | **iOS Safari smoke test** — audio unlock on first tap, background/lock-screen behavior, timer pause semantics |
| P1 | **Offline shell** — cache static assets so the installed app loads without network (audio engine is already local) |
| P2 | **`apple-mobile-web-app-*` meta** — status bar / title polish for home-screen launch |

### Device test checklist (use this when PWA is up)

- [ ] Add to home screen (iOS + Android if available)
- [ ] Play/pause from cold start; no double downbeat
- [ ] Drag BPM and timer with a finger
- [ ] Tap tempo while playing
- [ ] Practice timer: pause mid-run, adjust, resume; auto-stop at zero
- [ ] Per-beat accent toggles audible and visible
- [ ] Beats-per-bar change while stopped
- [ ] Screen layout: no scroll, controls reachable one-handed

---

## v1.x — polish (after device test)

Informed by **how it feels in use**, not speculation. Candidate bucket—pick only what real friction justifies:

| Area | Examples |
|------|-----------|
| **Design / UX** | Typography (`next/font`), spacing, touch targets, color tweaks, idle vs playing states |
| **Ergonomics** | Spacebar play/pause, master volume |
| **Quality** | Strict Mode / engine edge cases already handled; any Safari-specific fixes from checklist |

No new feature categories here unless device testing exposes a clear gap.

---

## v2 — deferred

Explicitly **not** v1. Revisit only if personal use still wants them after living with the PWA build.

| Feature | Notes |
|---------|--------|
| **Tempo progression** | Start/end BPM, one pacing model—no program builder (see `spec.md`) |
| **Subdivisions** | 8ths, triplets—display and/or clicks |
| **Pattern presets** | Rock / hat patterns—scheduler complexity |
| **Capacitor** | Native wrapper if PWA install or iOS limits aren’t enough |

---

## Explicit non-roadmap traps

| Avoid | Reason |
|--------|--------|
| Multi-stage programmable routines + save UX | Diverts into planner product |
| Streak/session analytics first-class UX | Signals growth metrics over practice tools |
| Social / leaderboard surfaces | Explicitly orthogonal goal |

Periodic review: Does this still feel like gear on a bench? If not—cut scope rather than layering motivation chrome.
