# Technical specification — Pocket Click

Authoritative runtime behavior lives in **`src/components/Metronome.tsx`** and the Next.js app under **`src/app/`**. This document records **engineering context**, **guardrails**, and **feature semantics** so implementation stays coherent.

Related docs: **[README.md](README.md)** (user-facing intro), **[roadmap.md](roadmap.md)** (planned work ordering).

---

## Stack

- **Next.js** (App Router), **React**, **TypeScript**
- **Tailwind CSS v4** (global styling; large parts of the metronome still use inline styles from the prototype)
- Optional futures called out explicitly: **Capacitor** (native wrapper), **PWA** manifest (install without store)

---

## Repository layout

| Path | Role |
|------|------|
| `src/app/layout.tsx` | Root layout, site metadata (“Pocket Click”) |
| `src/app/page.tsx` | Home page; renders the metronome |
| `src/components/Metronome.tsx` | Client component: UI + Web Audio scheduler + tap tempo |

---

## Product principles (implementation guardrails)

These are intentionally narrow so the codebase does not swell into generic “practice suite” UX.

1. **Solve practice, not discovery** — One screen bias; obvious controls; fast tempo/meter edits.
2. **Look and feel matter** — Choppy visuals or fiddly gestures undermine real use behind the kit.
3. **No bloat path** — Every control must earn placement; postpone demo-only ornament.
4. **Drills stay dumb** — Timers and tempo ramps remain **tools glued to the metronome**, not a parallel app surface (avoid gamification, session history-by-default, etc.).

---

## Audio engine (`Metronome.tsx`)

### Scheduling strategy

Scheduling uses **`AudioContext.currentTime`**, a **lookahead horizon** (`SCHEDULE_AHEAD`), and a **periodic timer** (`LOOKAHEAD` ms) that runs `scheduleBeats()` to enqueue ticks ahead of the playhead—not a naive per-beat `setInterval`.

This matches the well-known pattern from Chris Wilson’s **Web Audio lookahead scheduling** article (“Chris Wilson Web Audio scheduling” remains the usual search phrase).

Beat callbacks for the UI remain on timers derived from scheduled times (`setTimeout` after delay); audio timing stays on `AudioContext` time.

### Sounds

Four IDs, all **synthesized**: `click`, `wood`, `hi_hat`, `rim` (oscillators and short filtered noise buffers—no bundled samples).

---

## Implemented behavior snapshot

| Behavior | Detail |
|-----------|--------|
| BPM range | 20–300 |
| Tap tempo | Requires **≥2 taps** inside a sliding **3s** window; interval average → rounded BPM |
| Beats/bar | Integers **2–8**; visually and audibly accented **beat 1** |
| Tempo labels | Rough Italian-ish buckets driven by BPM (Larghetto → Prestissimo) |
| Practice timer | Drag to set **M:SS** (0:00 = off); always-visible clock beside BPM; **pause freezes** remaining; auto-stop at zero |

### Known gaps / refactor notes

| Topic | Notes |
|--------|--------|
| **`useEffect([playing])` + engine** | **Removed.** Play/pause now call `engine.start()` / `engine.stop()` directly from the button handler (user gesture + no effect cleanup races). Parameter sync while playing uses effects keyed only on `bpm` / `beats` / `sound`, not `playing`. |
| **Module singleton engine** | One module-level instance is fine for a single route. `stopScheduler()` stops queued sources, **clears pending beat `setTimeout`s**, disconnects nodes, and bumps a **generation** counter so stale callbacks no-op. |
| **Visual pulse** | Beat pips only; optional full-frame flash deferred. |
| **Mobile / iOS** | `AudioContext` may start suspended; `resume()` on start is wired—still verify **Safari**. |
| **Fonts** | Bebas Neue + DM Mono still loaded via **`@import` inside the component**. Prefer **`next/font/google`** to reduce CLS and satisfy Next idioms—see roadmap. |

---

## Planned features — semantics (not roadmap order)

Concrete ordering lives in **`roadmap.md`**. Brief semantics here constrain implementation drift.

### Practice timer

**Intent:** One extra axis on the **same surface**—duration → countdown → **stop playback** (“off-switch”).

- Avoid a separate session mode UX.
- Default: countdown hits zero once, metronome stops; no alarm loop unless you explicitly add it later.

**Anti-goals:** Push notifications, history/streak dashboards, motivational copy as first-class UX.

**UI:** Always-visible **M:SS** clock beside BPM; **drag up/down** in 15-second steps (0:00 = timer off). Locked while playing; editable when idle or paused. No preset buttons or dialogs.

**Open choice:** Pausing playback should either **freeze** practice time (common for “5 minutes playing”) or use **wall clock** countdown (simpler but can feel punitive). **Decision: pause freezes the clock**; resume continues from remaining time; a fresh session starts from the preset when remaining was exhausted or cleared.

### Tempo progression

**Intent:** Built-in slow-to-fast ramps for fundamentals—not a programmable workout planner.

**Inputs (keep bounded):**

- Start BPM / end BPM
- **Either** total ramp duration **or** incremental steps (bars or seconds)—**pick one dominant UI metaphor** so the screen cannot sprawl.

**Anti-goals:** Multi-leg programs, presets/save slots across sessions, sharable workouts.

**Engine:** `engine.setBpm` during playback is adequate for updates; descending ramps (start > end) need explicit UI rules (`swap`, `clamp`, forbid).

---

## Stretch (harder technical work)

Technical framing only—prioritization sits in roadmap.

| Item | Complexity driver |
|------|---------------------|
| **Subdivisions** | Extra pulses + UI sync |
| **Pattern presets** | Multi-event scheduling layering on scheduler |
| **Keyboard** | Play/pause, doc other shortcuts |
| **Volume / accent shaping** | Gain nodes or per-hit envelopes tied to UX |
| **PWA / Capacitor** | Packaging, splash, optionally offline caches |

---

## Design tokens (prototype-referenced)

Rough guide for aligning new UI—not a full token system unless you migrate to Tailwind/design tokens deliberately.

| Token | Typical use |
|--------|--------------|
| Background | `#0e0e0f` near-black panel feel |
| Foreground muted | `#e8e0d0` inactive emphasis text |
| Active / playing | `#e8c97a` warm amber accents |
| Type | **Bebas Neue** large BPM digits; **DM Mono** chrome + labels |
| Tone | Instrument bench / restrained industrial—credibility via type + restraint, not skeuomorphic chrome stacks |

---

## Disclaimer

Ideas seeded from exploratory chats elsewhere. **Treat this repo’s TypeScript/React source as authoritative** whenever this document lags Implementation.
