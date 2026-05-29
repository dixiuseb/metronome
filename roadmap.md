# Roadmap — Pocket Click

Broad intent: ship a dependable metronome with **minimal configuration**—then add only drills that genuinely help practice (**timer**, **tempo ramps**) without mutating Pocket Click into fitness-app UX.

- **User introduction:** [README.md](README.md)  
- **Technical detail & feature semantics:** [spec.md](spec.md)

---

## Now (baseline)

These are roughly what exists in **`src/components/Metronome.tsx`** today:

| Status | Capability |
|:------:|-----------|
| Done | BPM 20–300; drag BPM; ±1 / ±10 |
| Done | Tap tempo (≥2 taps / 3s window) |
| Done | Beats per bar **2–8**, accent beat 1 |
| Done | Four synthetic sounds (`click`, `wood`, `hi_hat`, `rim`) |
| Done | Beat pips synced to lookahead Web Audio scheduler |
| Done | Play / pause |
| Done | **Practice timer** — draggable M:SS clock (0:00 = off); pause freezes; auto-stop at zero |

**Quality / infra checks** (baseline polish)

- Confirm **Safari iOS** audio lifecycle with real devices.
- Watch **Strict Mode dev** quirks with the singleton engine.
- Migrate fonts to **`next/font/google`** (see spec Known gaps).

---

## MVP targets (functional completion)

Treat this as “first version worthy of trusting on the pad”—not exhaustive polish.

### Core metronome (remaining gaps toward MVP-complete)

| Priority | Task |
|:--------:|------|
| P1 | **Spacebar play/pause** + sensible focus/not-stealing focus rules |
| P1 | **Master volume** (optional **accent softer/louder** split if cheap) |

### Drill features — keep surface area tiny

Full semantics live in **`spec.md`**.

| Priority | Feature | Guardrail recap |
|:--------:|---------|------------------|
| Done | **Practice timer** | Draggable M:SS clock; 0:00 = off; pause freezes; auto-stop at zero |
| P2 | **Tempo progression** | Start BPM, end BPM, **one** pacing model UI (duration ramp *or* step cadence)—no workout builder |

Stretch candidates only after drills feel airtight or you postpone drills intentionally → see **Beyond MVP**.

---

## Suggested engineering order (near term)

Rough dependency-friendly sequence—adjust freely.

1. **Spacebar play/pause** + focus ergonomics  
2. **Tempo progression** bounded inputs vs builder UX creep  
3. **Master volume (+ optional accent differentiation)**  
4. **Fonts via `next/font/google`** (+ prune inline `@import` block)  
5. **Subdivisions display / optional audible subdivisions**  
6. **Pattern presets scheduling layer** rock / eighth hats / sparse jazz rides etc  
7. **PWA manifest** *(and/or evaluate Capacitor once web shell feels final)*  

---

## Beyond MVP (“still simple”—but harder)

Defer until drills + core ergonomics stabilize:

- Subdivision clicks/visuals refinement  
- Few **preset grooves** layering extra hits (scheduler complexity spikes)  
- **PWA** polish (icons/offline caches) • **Capacitor** wrapping  
- Expanded keyboard shortcuts (beyond space) documenting as you add them  

---

## Explicit non-roadmap traps

Watching for these avoids repeating bloated commodity metronomes:

| Avoid | Reason |
|--------|--------|
| Multi-stage programmable routines + save UX | Diverts into planner product |
| Streak/session analytics first-class UX | Signals growth metrics over practice tools |
| Social / leaderboard surfaces | Explicitly orthogonal goal |

Periodic review: Does this still feel like gear on a bench? If not—cut scope rather than layering motivation chrome.
