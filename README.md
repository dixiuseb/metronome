# Pocket Click (working title)

A **personal-use metronome**: no ads, no sign-up, no in-app purchases, no social layer. The goal is **tight timing**, **clear visuals**, and **a small set of sounds** that feel like **studio gear** (dark UI, restrained typography, high contrast) rather than a consumer “app store” product.

This repo is a **Next.js (App Router)** app. The metronome UI and audio engine live in **`src/components/Metronome.tsx`**. The sections below are the **product spec**; use them when extending features.

---

## Development (Next.js)

```bash
npm install   # already done if you cloned after scaffold
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Production build: `npm run build` then `npm start`.

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

**Engine note:** The engine exposes `setBpm` while running; progression is mostly **state + timing** (when to nudge BPM), reusing the same Web Audio scheduler. Watch edge cases when **end BPM** is below **start BPM** (descending ramp) if you allow it; otherwise forbid or auto-swap with clear UI.

### Stretch (still “simple,” but harder)

- **Subdivisions** (8ths, triplets) for display and/or clicks.
- **A few preset patterns** (e.g. straight rock, hi-hat 8ths, simple jazz ride) at the same BPM — **harder** because scheduling multiplies events; same Web Audio discipline applies.
- **Keyboard**: Space = play/pause (and document any other shortcuts).
- **Volume** (master + maybe accent vs unaccented).
- **PWA** and/or **Capacitor** so it installs like an app without an account.

---

## What the app already does (`src/components/Metronome.tsx`)

- **Web Audio scheduling**: Uses `AudioContext.currentTime` plus a **lookahead window** (`SCHEDULE_AHEAD`) and a **short `setTimeout` loop** (`LOOKAHEAD` ms) to queue upcoming beats — the same family of approach described in Chris Wilson’s classic write-up on **lookahead scheduling** (search: “Chris Wilson Web Audio scheduling”); **not** a naive `setInterval` per beat.
- **Sounds (4)**: `click`, `wood`, `hi_hat`, `rim` — all **synthesized** (oscillators / short noise buffers), no external samples.
- **Tap tempo**: Uses **two or more** taps within a 3s window (interval average → BPM).
- **BPM UI**: Drag vertically on the big number (mouse + touch), ±1 / ±10 buttons.
- **Beats per bar**: 2–7; **beat 1 accent** in audio and larger pip.
- **Tempo name**: Coarse Italian-ish bucket labels from BPM.
- **Branding in UI**: “Pocket Click” — rename later if you want.

### Honest gaps / follow-ups before you call it “shippable”

- **Effects dependency bug risk**: The effect that calls `engine.start(...)` only lists `[playing]` as a dependency, while `handleBeat` / initial `bpm` / `beats` / `sound` are read from the render that toggled play. It works for common flows; tightening deps or passing a ref for the callback avoids edge cases after refactors.
- **Singleton engine**: One module-level `engine` is fine for a single page; React **Strict Mode** double-mount in dev can surprise you — worth testing.
- **Visual “flash”**: Pips light up; there is **no** full-screen pulse yet if you want that for peripheral vision while playing.
- **Mobile audio policies**: Browsers may start `AudioContext` suspended until a user gesture — the code resumes on `start()`, which is correct; still worth testing on **iOS Safari** early.
- **Fonts**: Bebas Neue / DM Mono are still loaded via a `<style>` `@import` inside the component; moving to **`next/font/google`** would match Next best practices and reduce layout shift.

---

## Design direction (from the conversation, kept concrete)

- **Palette**: Near-black background (`#0e0e0f`), warm off-white for idle emphasis (`#e8e0d0`), amber/gold for active/playing (`#e8c97a`).
- **Type**: `Bebas Neue` for the big BPM readout; `DM Mono` for controls.
- **Vibe**: “Gear on a bench” — weight from typography and color discipline, not fake chrome.

---

## Suggested stack (when you build the real project)

- **Next.js + React** — in use.
- **Capacitor** if you want a home-screen app with minimal ceremony.
- **PWA manifest** is a low-friction alternative for installability without app store flow.

---

## Next engineering tasks (suggested order)

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

Ideas and early prototype text originated from a chat with another assistant; the **implemented behavior** is defined by `src/components/Metronome.tsx` and this README.
