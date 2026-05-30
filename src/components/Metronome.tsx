"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SoundId = "click" | "wood" | "hi_hat" | "rim";
/** 0 = normal, 1 = medium accent, 2 = strong accent */
type AccentLevel = 0 | 1 | 2;

function defaultBeatAccents(count: number): AccentLevel[] {
  return Array.from({ length: count }, (_, i) => (i === 0 ? 2 : 0));
}

function lerp(a: number, b: number, level: AccentLevel) {
  return a + (b - a) * (level / 2);
}

/**
 * iOS routes Web Audio through the "ringer" channel (muted by the hardware switch).
 * Looping silent HTML audio activates the "media" channel so clicks stay audible.
 * @see https://www.audjust.com/blog/unmute-web-audio-on-ios
 */
const SILENT_MP3 =
  "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRAmHAAAAAAD/+xDEAAvAAAGkAAAAIAAANIAAAARMQU1FMy45OC4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAGkAAAAAAAA0gAAAAAAABpAGkqJAAAc0gAAABjBExBTUUzLjEyMDKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kGQADAPAAAGkAAAAIAAANIAAAARMQU1FMy44LDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

let mediaChannelAudio: HTMLAudioElement | null = null;

function startMediaChannel() {
  if (typeof document === "undefined") return;
  if (!mediaChannelAudio) {
    mediaChannelAudio = document.createElement("audio");
    mediaChannelAudio.setAttribute("playsinline", "");
    mediaChannelAudio.setAttribute("webkit-playsinline", "true");
    mediaChannelAudio.setAttribute("x-webkit-airplay", "deny");
    mediaChannelAudio.preload = "auto";
    mediaChannelAudio.loop = true;
    mediaChannelAudio.volume = 0.01;
    mediaChannelAudio.src = SILENT_MP3;
    mediaChannelAudio.style.display = "none";
    document.body.appendChild(mediaChannelAudio);
  }
  if (!mediaChannelAudio.paused) return;
  void mediaChannelAudio.play().catch(() => {
    /* needs a user gesture — start() is always called from one */
  });
}

function stopMediaChannel() {
  if (!mediaChannelAudio || mediaChannelAudio.paused) return;
  mediaChannelAudio.pause();
  mediaChannelAudio.currentTime = 0;
}

// ─── Audio Engine ───────────────────────────────────────────────────────────
function createAudioEngine() {
  let ctx: AudioContext | null = null;
  let nextBeatTime = 0;
  let currentBeat = 0;
  let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
  let bpm = 120;
  let beatsPerBar = 4;
  let soundType: SoundId = "click";
  let accentPattern: AccentLevel[] = defaultBeatAccents(4);
  let onBeat: ((beatIndex: number) => void) | null = null;
  /** Stops future clicks when `stop()` runs (dev Strict Mode double-mount, pause, etc.). */
  let scheduledSources: AudioScheduledSourceNode[] = [];
  /** Bumped in `stop()` so stale `setTimeout` chains and UI callbacks no-op. */
  let playbackGeneration = 0;
  let beatCallbackTimers: ReturnType<typeof setTimeout>[] = [];

  const LOOKAHEAD = 25; // ms
  const SCHEDULE_AHEAD = 0.1; // seconds

  function getCtx(): AudioContext {
    if (!ctx) {
      const Ctor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) throw new Error("Web Audio API not supported");
      ctx = new Ctor();
    }
    return ctx;
  }

  function trackSource(node: AudioScheduledSourceNode) {
    scheduledSources.push(node);
  }

  function silenceScheduledSources() {
    const c = ctx;
    const stopAt = c ? c.currentTime : 0;
    for (const node of scheduledSources) {
      try {
        node.stop(stopAt);
      } catch {
        // already stopped / not started
      }
      try {
        node.disconnect();
      } catch {
        // already disconnected
      }
    }
    scheduledSources = [];
  }

  function clearBeatCallbacks() {
    for (const timerId of beatCallbackTimers) clearTimeout(timerId);
    beatCallbackTimers = [];
  }

  function stopScheduler() {
    silenceScheduledSources();
    clearBeatCallbacks();
    if (schedulerTimer) clearTimeout(schedulerTimer);
    schedulerTimer = null;
    playbackGeneration += 1;
  }

  function playClick(time: number, level: AccentLevel) {
    const c = getCtx();
    const sounds: Record<SoundId, () => void> = {
      click: () => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.frequency.value = lerp(1200, 1800, level);
        gain.gain.setValueAtTime(lerp(0.6, 0.9, level), time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        trackSource(osc);
        osc.start(time);
        osc.stop(time + 0.05);
      },
      wood: () => {
        const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 8);
        const src = c.createBufferSource();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = lerp(600, 900, level);
        filter.Q.value = 8;
        src.buffer = buf;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        gain.gain.setValueAtTime(lerp(0.8, 1.2, level), time);
        trackSource(src);
        src.start(time);
      },
      hi_hat: () => {
        const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++)
          data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        const src = c.createBufferSource();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.value = 7000;
        src.buffer = buf;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        gain.gain.setValueAtTime(lerp(0.5, 0.8, level), time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        trackSource(src);
        src.start(time);
      },
      rim: () => {
        const c2 = getCtx();
        const osc = c2.createOscillator();
        const oscGain = c2.createGain();
        osc.frequency.value = lerp(320, 400, level);
        osc.connect(oscGain);
        oscGain.connect(c2.destination);
        oscGain.gain.setValueAtTime(lerp(0.4, 0.6, level), time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        trackSource(osc);
        osc.start(time);
        osc.stop(time + 0.03);
        const buf = c2.createBuffer(1, c2.sampleRate * 0.03, c2.sampleRate);
        const noise = buf.getChannelData(0);
        for (let i = 0; i < noise.length; i++)
          noise[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / noise.length, 6);
        const src = c2.createBufferSource();
        const nGain = c2.createGain();
        src.buffer = buf;
        src.connect(nGain);
        nGain.connect(c2.destination);
        nGain.gain.setValueAtTime(lerp(0.3, 0.5, level), time);
        trackSource(src);
        src.start(time);
      },
    };
    (sounds[soundType] ?? sounds.click)();
  }

  return {
    start(
      b: number,
      beats: number,
      sound: SoundId,
      accents: AccentLevel[],
      callback: (beatIndex: number) => void,
    ) {
      stopScheduler();

      const sessionGeneration = playbackGeneration;

      bpm = b;
      beatsPerBar = beats;
      soundType = sound;
      accentPattern =
        accents.length === beats ? accents : defaultBeatAccents(beats);
      onBeat = callback;

      startMediaChannel();

      const begin = () => {
        currentBeat = 0;
        nextBeatTime = c.currentTime + 0.05;

        function scheduleBeats() {
          if (sessionGeneration !== playbackGeneration) return;

          while (nextBeatTime < c.currentTime + SCHEDULE_AHEAD) {
            const beatIndex = currentBeat;
            const accentLevel = accentPattern[beatIndex] ?? 0;
            const scheduledTime = nextBeatTime;
            playClick(scheduledTime, accentLevel);

            const delay = Math.max(0, (scheduledTime - c.currentTime) * 1000);
            beatCallbackTimers.push(
              setTimeout(() => {
                if (sessionGeneration !== playbackGeneration) return;
                onBeat?.(beatIndex);
              }, delay),
            );

            currentBeat = (currentBeat + 1) % beatsPerBar;
            nextBeatTime += 60.0 / bpm;
          }
          schedulerTimer = setTimeout(() => {
            if (sessionGeneration !== playbackGeneration) return;
            scheduleBeats();
          }, LOOKAHEAD);
        }

        scheduleBeats();
      };

      const c = getCtx();
      if (c.state === "suspended") {
        void c.resume().then(begin);
      } else {
        begin();
      }
    },
    stop() {
      stopScheduler();
      stopMediaChannel();
    },
    setBpm(b: number) {
      bpm = b;
    },
    setBeats(b: number) {
      if (b === beatsPerBar) return;
      beatsPerBar = b;
      currentBeat = 0;
    },
    setSound(s: SoundId) {
      soundType = s;
    },
    setAccents(accents: AccentLevel[]) {
      accentPattern =
        accents.length === beatsPerBar
          ? accents
          : defaultBeatAccents(beatsPerBar);
    },
  };
}

const engine = createAudioEngine();

// ─── Tap Tempo ───────────────────────────────────────────────────────────────
function useTapTempo(onTap: (bpm: number) => void) {
  const taps = useRef<number[]>([]);
  return useCallback(() => {
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < 3000);
    taps.current.push(now);
    if (taps.current.length >= 2) {
      const intervals = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const next = Math.round(60000 / avg);
      onTap(Math.min(300, Math.max(20, next)));
    }
  }, [onTap]);
}

// ─── Component ───────────────────────────────────────────────────────────────
const SOUNDS: { id: SoundId; label: string }[] = [
  { id: "click", label: "Click" },
  { id: "wood", label: "Wood" },
  { id: "hi_hat", label: "Hi-Hat" },
  { id: "rim", label: "Rimshot" },
];

const TIME_SIGS = [2, 3, 4, 5, 6, 7, 8] as const;

const MAX_TIMER_SEC = 60 * 60;
const TIMER_DRAG_STEP_SEC = 15;

function formatTimer(totalSec: number) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function clampTimerSec(sec: number) {
  return Math.min(MAX_TIMER_SEC, Math.max(0, Math.round(sec)));
}

function snapTimerSec(sec: number) {
  const clamped = clampTimerSec(sec);
  return Math.round(clamped / TIMER_DRAG_STEP_SEC) * TIMER_DRAG_STEP_SEC;
}

function pipSize(level: AccentLevel) {
  return level === 2 ? 18 : level === 1 ? 16 : 14;
}

const PIP_SLOT_SIZE = 18;

function pipIdleStyle(level: AccentLevel) {
  if (level === 2) return { background: "#252218", border: "#554a32" };
  if (level === 1) return { background: "#1f1f1a", border: "#3a3a32" };
  return { background: "#1e1e20", border: "#2a2a2c" };
}

function pipActiveStyle(level: AccentLevel) {
  if (level === 2) return { background: "#e8c97a", shadow: "0 0 12px #e8c97a88" };
  if (level === 1) return { background: "#a89060", shadow: "0 0 8px #a8906088" };
  return { background: "#888", shadow: "0 0 8px #55555588" };
}

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [beats, setBeats] = useState(4);
  const [beatAccents, setBeatAccents] = useState<AccentLevel[]>(() =>
    defaultBeatAccents(4),
  );
  const [sound, setSound] = useState<SoundId>("click");
  const [timerPresetSec, setTimerPresetSec] = useState(0);
  const [timerRemainingSec, setTimerRemainingSec] = useState<number | null>(
    null,
  );
  const [activeBeat, setActiveBeat] = useState(-1);
  const [dragging, setDragging] = useState(false);
  const [timerDragging, setTimerDragging] = useState(false);
  const dragStart = useRef<{ y: number; bpm: number } | null>(null);
  const timerDragStart = useRef<{ y: number; sec: number } | null>(null);
  const bpmRef = useRef(bpm);
  const timerDisplaySecRef = useRef(0);
  const playingRef = useRef(playing);
  const onBeatRef = useRef<(beatIndex: number) => void>(() => {});
  const timerPresetSecRef = useRef(timerPresetSec);
  const beatAccentsRef = useRef(beatAccents);
  const stopPlaybackRef = useRef<() => void>(() => {});

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    timerPresetSecRef.current = timerPresetSec;
  }, [timerPresetSec]);

  useEffect(() => {
    beatAccentsRef.current = beatAccents;
  }, [beatAccents]);

  useEffect(() => {
    timerDisplaySecRef.current =
      timerRemainingSec !== null ? timerRemainingSec : timerPresetSec;
  }, [timerRemainingSec, timerPresetSec]);

  const handleBeat = useCallback((beatIndex: number) => {
    setActiveBeat(beatIndex);
    setTimeout(() => setActiveBeat(-1), 80);
  }, []);

  useEffect(() => {
    onBeatRef.current = handleBeat;
  }, [handleBeat]);

  const stopPlayback = useCallback(() => {
    engine.stop();
    playingRef.current = false;
    setPlaying(false);
  }, []);

  useEffect(() => {
    stopPlaybackRef.current = stopPlayback;
  }, [stopPlayback]);

  const togglePlay = useCallback(() => {
    if (playingRef.current) {
      stopPlayback();
      return;
    }

    engine.start(
      bpmRef.current,
      beats,
      sound,
      beatAccentsRef.current,
      (beatIndex) => {
        onBeatRef.current(beatIndex);
      },
    );
    playingRef.current = true;
    setPlaying(true);

    if (timerPresetSecRef.current > 0) {
      setTimerRemainingSec((prev) => {
        if (prev === null || prev <= 0) return timerPresetSecRef.current;
        return prev;
      });
    }
  }, [beats, sound, stopPlayback]);

  // Countdown only while playing; pause freezes remaining time.
  useEffect(() => {
    if (!playing) return;

    const id = window.setInterval(() => {
      setTimerRemainingSec((prev) => {
        if (prev === null || prev <= 0) return prev;
        if (prev <= 1) {
          stopPlaybackRef.current();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [playing]);

  const applyTimerSec = useCallback((sec: number) => {
    const snapped = snapTimerSec(sec);
    setTimerPresetSec(snapped);
    if (!playingRef.current) {
      setTimerRemainingSec((prev) => (prev !== null ? snapped : null));
    }
  }, []);

  // Stop on unmount only — not tied to play/pause (avoids effect cleanup re-start races).
  useEffect(() => () => engine.stop(), []);

  useEffect(() => {
    if (playingRef.current) engine.setBpm(bpm);
  }, [bpm]);
  useEffect(() => {
    if (playingRef.current) engine.setBeats(beats);
  }, [beats]);
  useEffect(() => {
    if (playingRef.current) engine.setSound(sound);
  }, [sound]);

  useEffect(() => {
    if (playingRef.current) engine.setAccents(beatAccents);
  }, [beatAccents]);

  const handleBeatsChange = useCallback((n: number) => {
    setBeats(n);
    setBeatAccents((prev) => {
      const next = defaultBeatAccents(n);
      for (let i = 0; i < Math.min(prev.length, n); i++) {
        next[i] = prev[i];
      }
      return next;
    });
  }, []);

  const cycleBeatAccent = useCallback((index: number) => {
    setBeatAccents((prev) => {
      const next = [...prev];
      next[index] = ((next[index] ?? 0) + 1) % 3 as AccentLevel;
      return next;
    });
  }, []);

  const handleTap = useTapTempo((tappedBpm) => {
    startMediaChannel();
    setBpm(tappedBpm);
    if (playing) engine.setBpm(tappedBpm);
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    dragStart.current = { y: e.clientY, bpm: bpmRef.current };
    setDragging(true);
  };
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStart.current) return;
      const delta = Math.round((dragStart.current.y - e.clientY) / 2);
      const newBpm = Math.min(300, Math.max(20, dragStart.current.bpm + delta));
      setBpm(newBpm);
      if (playing) engine.setBpm(newBpm);
    },
    [playing],
  );
  const handleMouseUp = useCallback(() => {
    dragStart.current = null;
    setDragging(false);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStart.current = { y: e.touches[0].clientY, bpm: bpmRef.current };
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart.current) return;
    const delta = Math.round((dragStart.current.y - e.touches[0].clientY) / 2);
    const newBpm = Math.min(300, Math.max(20, dragStart.current.bpm + delta));
    setBpm(newBpm);
    if (playing) engine.setBpm(newBpm);
  };

  const handleTimerMouseDown = (e: React.MouseEvent) => {
    if (playingRef.current) return;
    const snapped = snapTimerSec(timerDisplaySecRef.current);
    if (snapped !== timerDisplaySecRef.current) {
      applyTimerSec(snapped);
    }
    timerDragStart.current = { y: e.clientY, sec: snapped };
    setTimerDragging(true);
  };
  const handleTimerMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!timerDragStart.current) return;
      const deltaSteps = Math.round(
        (timerDragStart.current.y - e.clientY) / 6,
      );
      applyTimerSec(
        timerDragStart.current.sec + deltaSteps * TIMER_DRAG_STEP_SEC,
      );
    },
    [applyTimerSec],
  );
  const handleTimerMouseUp = useCallback(() => {
    timerDragStart.current = null;
    setTimerDragging(false);
  }, []);

  useEffect(() => {
    if (timerDragging) {
      window.addEventListener("mousemove", handleTimerMouseMove);
      window.addEventListener("mouseup", handleTimerMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleTimerMouseMove);
      window.removeEventListener("mouseup", handleTimerMouseUp);
    };
  }, [timerDragging, handleTimerMouseMove, handleTimerMouseUp]);

  const handleTimerTouchStart = (e: React.TouchEvent) => {
    if (playingRef.current) return;
    const snapped = snapTimerSec(timerDisplaySecRef.current);
    if (snapped !== timerDisplaySecRef.current) {
      applyTimerSec(snapped);
    }
    timerDragStart.current = {
      y: e.touches[0].clientY,
      sec: snapped,
    };
  };
  const handleTimerTouchMove = (e: React.TouchEvent) => {
    if (!timerDragStart.current || playingRef.current) return;
    const deltaSteps = Math.round(
      (timerDragStart.current.y - e.touches[0].clientY) / 6,
    );
    applyTimerSec(
      timerDragStart.current.sec + deltaSteps * TIMER_DRAG_STEP_SEC,
    );
  };

  const tempoLabel =
    bpm < 60
      ? "Larghetto"
      : bpm < 76
        ? "Andante"
        : bpm < 108
          ? "Moderato"
          : bpm < 132
            ? "Allegro"
            : bpm < 168
              ? "Presto"
              : "Prestissimo";

  const highlightedBeat = playing ? activeBeat : -1;
  const timerDisplaySec =
    timerRemainingSec !== null ? timerRemainingSec : timerPresetSec;
  const timerSessionActive = timerRemainingSec !== null;
  const timerColor = playing
    ? "#e8c97a"
    : timerSessionActive
      ? "#e8e0d0"
      : timerPresetSec > 0
        ? "#888"
        : "#555";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        padding: "24px",
        userSelect: "none",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        .beat-pip { transition: background 0.05s, box-shadow 0.05s, border-color 0.12s; }
        .beat-pip-btn {
          padding: 0;
          cursor: pointer;
          flex-shrink: 0;
          width: ${PIP_SLOT_SIZE}px;
          height: ${PIP_SLOT_SIZE}px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
        }
        .beat-pip-btn:hover { filter: brightness(1.15); }
        .btn-sound { transition: all 0.12s; }
        .btn-sound:hover { background: #2a2a2c !important; }
        .play-btn { transition: all 0.12s; }
        .play-btn:hover { transform: scale(1.04); }
        .play-btn:active { transform: scale(0.97); }
        .tap-btn:active { background: #2a2a2c !important; transform: scale(0.97); }
        .bpm-display { cursor: ns-resize; }
        .bpm-display:active { opacity: 0.85; }
        .timer-display { cursor: ns-resize; }
        .timer-display:active { opacity: 0.85; }
        .timer-display.is-locked { cursor: not-allowed; opacity: 0.85; }
        .time-btn:hover { border-color: #e8e0d0 !important; color: #e8e0d0 !important; }
      `}</style>

      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 13,
            letterSpacing: 6,
            color: "#555",
            marginBottom: 4,
          }}
        >
          POCKET CLICK
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 8,
        }}
      >
        <div
          className="bpm-display"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "14px 36px 12px",
            borderRadius: 4,
            background: "#141416",
            border: "1px solid #222",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 96,
              lineHeight: 1,
              letterSpacing: 2,
              color: playing ? "#e8c97a" : "#e8e0d0",
              transition: "color 0.2s",
              minWidth: 140,
              textAlign: "center",
            }}
          >
            {bpm}
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: 3,
              color: "#444",
              marginTop: 4,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            BPM — DRAG
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#555",
          letterSpacing: 3,
          marginBottom: 36,
          fontFamily: "'DM Mono', monospace",
        }}
      >
        {tempoLabel.toUpperCase()}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {([-10, -1, 1, 10] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              const n = Math.min(300, Math.max(20, bpm + d));
              setBpm(n);
              if (playing) engine.setBpm(n);
            }}
            style={{
              background: "#141416",
              border: "1px solid #2a2a2c",
              color: "#888",
              fontFamily: "'DM Mono', monospace",
              fontSize: 12,
              padding: "8px 14px",
              borderRadius: 3,
              cursor: "pointer",
              letterSpacing: 1,
              transition: "all 0.1s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#e8e0d0";
              e.currentTarget.style.borderColor = "#444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#888";
              e.currentTarget.style.borderColor = "#2a2a2c";
            }}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 40 }}>
        {Array.from({ length: beats }).map((_, i) => {
          const level = beatAccents[i] ?? 0;
          const size = pipSize(level);
          const isActive = highlightedBeat === i;
          const idle = pipIdleStyle(level);
          const active = pipActiveStyle(level);
          return (
            <button
              key={i}
              type="button"
              className="beat-pip-btn"
              aria-label={`Beat ${i + 1}, accent level ${level}`}
              onClick={() => cycleBeatAccent(i)}
            >
              <div
                className="beat-pip"
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: isActive ? active.background : idle.background,
                  border: `1px solid ${isActive ? active.background : idle.border}`,
                  boxShadow: isActive ? active.shadow : "none",
                }}
              />
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          marginBottom: 36,
          width: "100%",
          maxWidth: 320,
        }}
      >
        <button
          type="button"
          className="tap-btn"
          onClick={handleTap}
          style={{
            justifySelf: "end",
            background: "#141416",
            border: "1px solid #2a2a2c",
            color: "#888",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            padding: "14px 22px",
            borderRadius: 3,
            cursor: "pointer",
            transition: "all 0.1s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#e8e0d0";
            e.currentTarget.style.borderColor = "#444";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#888";
            e.currentTarget.style.borderColor = "#2a2a2c";
          }}
        >
          TAP
        </button>

        <button
          type="button"
          className="play-btn"
          onClick={togglePlay}
          style={{
            width: 88,
            height: 52,
            background: playing ? "#e8c97a" : "#1e1e20",
            border: playing ? "1px solid #e8c97a" : "1px solid #333",
            borderRadius: 3,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {playing ? (
            <div style={{ display: "flex", gap: 5 }}>
              <div
                style={{
                  width: 4,
                  height: 18,
                  background: "#0e0e0f",
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  width: 4,
                  height: 18,
                  background: "#0e0e0f",
                  borderRadius: 1,
                }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 0,
                height: 0,
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                borderLeft: "18px solid #e8e0d0",
                marginLeft: 4,
              }}
            />
          )}
        </button>

        <div
          className={`timer-display${playing ? " is-locked" : ""}`}
          onMouseDown={handleTimerMouseDown}
          onTouchStart={handleTimerTouchStart}
          onTouchMove={handleTimerTouchMove}
          style={{
            justifySelf: "start",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: 52,
            minWidth: 72,
            padding: "0 12px",
            borderRadius: 3,
            background: "#141416",
            border: "1px solid #222",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              lineHeight: 1,
              letterSpacing: 1,
              color: timerColor,
              transition: "color 0.2s",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTimer(timerDisplaySec)}
          </div>
          <div
            style={{
              fontSize: 7,
              letterSpacing: 2,
              color: "#444",
              marginTop: 3,
              fontFamily: "'DM Mono', monospace",
            }}
          >
            DRAG
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 4,
            color: "#444",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          BEATS PER BAR
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {TIME_SIGS.map((n) => (
            <button
              key={n}
              type="button"
              className="time-btn"
              onClick={() => handleBeatsChange(n)}
              style={{
                width: 36,
                height: 36,
                background: beats === n ? "#e8c97a" : "#141416",
                border: `1px solid ${beats === n ? "#e8c97a" : "#2a2a2c"}`,
                color: beats === n ? "#0e0e0f" : "#666",
                fontFamily: "'DM Mono', monospace",
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 10,
            letterSpacing: 4,
            color: "#444",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          SOUND
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {SOUNDS.map((s) => (
            <button
              key={s.id}
              type="button"
              className="btn-sound"
              onClick={() => setSound(s.id)}
              style={{
                padding: "8px 14px",
                background: sound === s.id ? "#e8c97a" : "#141416",
                border: `1px solid ${sound === s.id ? "#e8c97a" : "#2a2a2c"}`,
                color: sound === s.id ? "#0e0e0f" : "#666",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10,
                letterSpacing: 2,
                borderRadius: 3,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 48,
          fontSize: 10,
          color: "#2a2a2c",
          letterSpacing: 3,
        }}
      >
        POCKET CLICK — NO ADS. NO BS.
      </div>
    </div>
  );
}
