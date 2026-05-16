# Pocket Click (working title)

A **personal-use metronome**: no ads, no sign-up, no in-app purchases, no social layer. The goal is **tight timing**, **clear visuals**, and **a small set of sounds** that feel like **studio gear** (dark UI, restrained typography, high contrast) rather than a consumer “app store” product.

This folder currently holds the **React prototype** in `metronome.jsx` and this README as the **parked spec** for when you pick the project back up.

---

## Product principles

- **Solve practice, not discovery**: one screen, obvious controls, fast to change tempo and meter.
- **Look and feel are part of the feature**: if it feels cheap or fiddly, you will not use it under headphones at the kit.
- **No bloat path**: every control should earn its place; defer “nice demos” until core practice loops are solid.
- **Drills stay dumb on purpose**: timers and tempo ramps are tools, not a second app (no gamification, no “programs,” no history by default).

---

## MVP (v1) — scope

| Feature | Notes |
|--------|--------|
| **Tempo (BPM)** | Reliable; UI that works with mouse **and** touch. |
| **Tap tempo** | Average recent taps into BPM. |
| **Time signature (numerator)** | e.g. 2–7 beats per bar; beat 1 **accent** matters for feel. |
| **Sound choice** | Small palette of distinct tones (synthetic is fine; no sample pack required for MVP). |
| **Visual pulse** | At minimum: per-beat indicators (stronger on beat 1). Optional: subtle full-field flash later. |
| **Play / pause** | Obvious primary control. |
| **Practice timer** | Optional countdown; when it hits zero, **stop the metronome** (see below). |
| **Tempo progression** | Optional ramp from a **start BPM** to an **end BPM** over time or by step (see below). |

### Practice timer (spec)

**Intent:** Clean, single-purpose, **zero configuration overhead** — e.g. set five minutes and forget it.

- **Not a new mode**: still the same metronome screen; the timer is an **off-switch** (and maybe a small visible countdown), not a separate “session” experience.
- **Behavior:** User sets a **duration**; it **counts down**; when it reaches zero, **playback stops** (and the timer is done — no recurring alarm loop unless you explicitly want that later; default is **stop once**).
- **Explicit non-goals:** No push notifications, no session history, no streak tracking, no analytics narrative. That is where the feature **curdles** into a different product.

**Open decision when you implement:** Whether **pause** pauses the practice clock. For “five minutes of actual playing,” pausing the timer with the metronome usually matches intuition; wall-clock-only countdown is simpler but can feel unfair if you stop to adjust sticks. Pick one and stick to it in the UI copy.

### Tempo progression (spec)

**Intent:** Genuinely useful for **fundamentals** — a built-in version of “start slow, build up,” which you would do manually anyway.

- **Inputs (keep minimal):** **Start BPM**, **end BPM**, and either **total duration** of the ramp or a fixed **increment** (e.g. +1 BPM every N bars or every N seconds — choose **one** primary model in the UI so it does not sprawl).
- **Explicit non-goals:** No **program builder**: multiple stages, named presets, save slots, or shareable routines. That line is “metronome plus” bloat; crossing it turns this into workout-app UX.

**Engine note:** The prototype already exposes `engine.setBpm` while running; progression is mostly **state + timing** (when to nudge BPM), reusing the same Web Audio scheduler. Watch edge cases when **end BPM** is below **start BPM** (descending ramp) if you allow it; otherwise forbid or auto-swap with clear UI.

### Stretch (still “simple,” but harder)

- **Subdivisions** (8ths, triplets) for display and/or clicks.
- **A few preset patterns** (e.g. straight rock, hi-hat 8ths, simple jazz ride) at the same BPM — **harder** because scheduling multiplies events; same Web Audio discipline applies.
- **Keyboard**: Space = play/pause (and document any other shortcuts).
- **Volume** (master + maybe accent vs unaccented).
- **PWA** and/or **Capacitor** so it installs like an app without an account.

---

## What the prototype already does (`metronome.jsx`)

Verified against the file in this repo:

- **Web Audio scheduling**: Uses `AudioContext.currentTime` plus a **lookahead window** (`SCHEDULE_AHEAD`) and a **short `setTimeout` loop** (`LOOKAHEAD` ms) to queue upcoming beats — the same family of approach described in Chris Wilson’s classic write-up on **lookahead scheduling** (search: “Chris Wilson Web Audio scheduling”); **not** a naive `setInterval` per beat.
- **Sounds (4)**: `click`, `wood`, `hi_hat`, `rim` — all **synthesized** (oscillators / short noise buffers), no external samples.
- **Tap tempo**: Uses **two or more** taps within a 3s window (interval average → BPM). *Earlier chat text said “3+ taps”; the code only needs 2 for a first estimate.*
- **BPM UI**: Drag vertically on the big number (mouse + touch), ±1 / ±10 buttons.
- **Beats per bar**: 2–7; **beat 1 accent** in audio and larger pip.
- **Tempo name**: Coarse Italian-ish bucket labels from BPM.
- **Branding in UI**: “Pocket Click” — rename later if you want.

### Honest gaps / follow-ups before you call it “shippable”

- **Effects dependency bug risk**: The effect that calls `engine.start(...)` only lists `[playing]` as a dependency, while `handleBeat` / initial `bpm` / `beats` / `sound` are read from the render that toggled play. It works for common flows; tightening deps or passing a ref for the callback avoids edge cases after refactors.
- **Singleton engine**: One module-level `engine` is fine for a single page; React **Strict Mode** double-mount in dev can surprise you — worth testing when you scaffold the real app.
- **Visual “flash”**: Pips light up; there is **no** full-screen pulse yet if you want that for peripheral vision while playing.
- **Mobile audio policies**: Browsers may start `AudioContext` suspended until a user gesture — the code resumes on `start()`, which is correct; still worth testing on **iOS Safari** early.

---

## Design direction (from the conversation, kept concrete)

- **Palette**: Near-black background (`#0e0e0f`), warm off-white for idle emphasis (`#e8e0d0`), amber/gold for active/playing (`#e8c97a`).
- **Type**: `Bebas Neue` for the big BPM readout; `DM Mono` for controls — loaded via Google Fonts in the component today; move to `next/font` or self-hosted when you app-ify.
- **Vibe**: “Gear on a bench” — weight from typography and color discipline, not fake chrome.

---

## Suggested stack (when you build the real project)

- **Next.js + React** for UI and routing (even if there is only one route at first).
- **Capacitor** if you want a home-screen app with minimal ceremony (you’ve used this pattern elsewhere).
- **PWA manifest** is a low-friction alternative for installability without app store flow.

---

## Quick start when you return

1. Scaffold a React app (Next.js or Vite + React — your preference).
2. Copy `metronome.jsx` into `components/Metronome.tsx` or `.jsx`, fix imports for your app’s React version.
3. Render `<Metronome />` on a single page; confirm **tap-to-start** audio on mobile.
4. Work down the **gaps** list above, then the **stretch** list.

Optional first engineering tasks (order of leverage):

1. Spacebar play/pause + focus management.
2. **Practice timer** (countdown + stop at zero; clarify pause semantics in copy).
3. **Tempo progression** (bounded inputs; linear or stepped ramp; no save slots).
4. Master volume + accent level.
5. Subdivision display / optional subdivision clicks.
6. Pattern presets (new scheduler layer).
7. PWA + icons + offline (static app is easy to cache).

---

## Name / positioning

“Pocket Click” is a fine codename; rename before any public release if you want something less generic. Positioning line in the UI today: **“No ads. No BS.”** — matches the product intent.

---

## Disclaimer

Ideas and prototype text originated from a chat with another assistant; **this README and the code were reviewed** so the “what’s actually implemented” section matches `metronome.jsx`. Treat chat claims (e.g. exact tap count, sound list) as **non-authoritative** unless they match the file or this doc.
