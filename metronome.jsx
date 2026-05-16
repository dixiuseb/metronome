import { useState, useEffect, useRef, useCallback } from "react";

// ─── Audio Engine ───────────────────────────────────────────────────────────
function createAudioEngine() {
  let ctx = null;
  let nextBeatTime = 0;
  let currentBeat = 0;
  let schedulerTimer = null;
  let bpm = 120;
  let beatsPerBar = 4;
  let soundType = "click";
  let onBeat = null;

  const LOOKAHEAD = 25; // ms
  const SCHEDULE_AHEAD = 0.1; // seconds

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function playClick(time, isAccent) {
    const c = getCtx();
    const sounds = {
      click: () => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain); gain.connect(c.destination);
        osc.frequency.value = isAccent ? 1800 : 1200;
        gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        osc.start(time); osc.stop(time + 0.05);
      },
      wood: () => {
        const buf = c.createBuffer(1, c.sampleRate * 0.05, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 8);
        const src = c.createBufferSource();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();
        filter.type = "bandpass"; filter.frequency.value = isAccent ? 900 : 600; filter.Q.value = 8;
        src.buffer = buf;
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        gain.gain.setValueAtTime(isAccent ? 1.2 : 0.8, time);
        src.start(time);
      },
      hi_hat: () => {
        const buf = c.createBuffer(1, c.sampleRate * 0.06, c.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
        const src = c.createBufferSource();
        const gain = c.createGain();
        const filter = c.createBiquadFilter();
        filter.type = "highpass"; filter.frequency.value = 7000;
        src.buffer = buf;
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        gain.gain.setValueAtTime(isAccent ? 0.8 : 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        src.start(time);
      },
      rim: () => {
        const c2 = getCtx();
        // Tone component
        const osc = c2.createOscillator();
        const oscGain = c2.createGain();
        osc.frequency.value = isAccent ? 400 : 320;
        osc.connect(oscGain); oscGain.connect(c2.destination);
        oscGain.gain.setValueAtTime(isAccent ? 0.6 : 0.4, time);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.start(time); osc.stop(time + 0.03);
        // Noise component
        const buf = c2.createBuffer(1, c2.sampleRate * 0.03, c2.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
        const src = c2.createBufferSource();
        const nGain = c2.createGain();
        src.buffer = buf; src.connect(nGain); nGain.connect(c2.destination);
        nGain.gain.setValueAtTime(isAccent ? 0.5 : 0.3, time);
        src.start(time);
      }
    };
    (sounds[soundType] || sounds.click)();
  }

  function scheduleBeats() {
    const c = getCtx();
    while (nextBeatTime < c.currentTime + SCHEDULE_AHEAD) {
      const isAccent = currentBeat === 0;
      const beatIndex = currentBeat;
      const scheduledTime = nextBeatTime;
      playClick(scheduledTime, isAccent);

      // Fire visual callback near the beat
      const delay = Math.max(0, (scheduledTime - c.currentTime) * 1000);
      setTimeout(() => { if (onBeat) onBeat(beatIndex); }, delay);

      currentBeat = (currentBeat + 1) % beatsPerBar;
      nextBeatTime += 60.0 / bpm;
    }
    schedulerTimer = setTimeout(scheduleBeats, LOOKAHEAD);
  }

  return {
    start(b, beats, sound, callback) {
      bpm = b; beatsPerBar = beats; soundType = sound; onBeat = callback;
      const c = getCtx();
      if (c.state === "suspended") c.resume();
      currentBeat = 0;
      nextBeatTime = c.currentTime + 0.05;
      scheduleBeats();
    },
    stop() {
      if (schedulerTimer) clearTimeout(schedulerTimer);
      schedulerTimer = null;
    },
    setBpm(b) { bpm = b; },
    setBeats(b) { beatsPerBar = b; currentBeat = 0; },
    setSound(s) { soundType = s; },
  };
}

const engine = createAudioEngine();

// ─── Tap Tempo ───────────────────────────────────────────────────────────────
function useTapTempo(onTap) {
  const taps = useRef([]);
  return useCallback(() => {
    const now = Date.now();
    taps.current = taps.current.filter(t => now - t < 3000);
    taps.current.push(now);
    if (taps.current.length >= 2) {
      const intervals = taps.current.slice(1).map((t, i) => t - taps.current[i]);
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = Math.round(60000 / avg);
      onTap(Math.min(300, Math.max(20, bpm)));
    }
  }, [onTap]);
}

// ─── Component ───────────────────────────────────────────────────────────────
const SOUNDS = [
  { id: "click", label: "Click" },
  { id: "wood", label: "Wood" },
  { id: "hi_hat", label: "Hi-Hat" },
  { id: "rim", label: "Rimshot" },
];

const TIME_SIGS = [2, 3, 4, 5, 6, 7];

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [playing, setPlaying] = useState(false);
  const [beats, setBeats] = useState(4);
  const [sound, setSound] = useState("click");
  const [activeBeat, setActiveBeat] = useState(-1);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef(null);
  const bpmRef = useRef(bpm);

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);

  const handleBeat = useCallback((beatIndex) => {
    setActiveBeat(beatIndex);
    setTimeout(() => setActiveBeat(-1), 80);
  }, []);

  useEffect(() => {
    if (playing) {
      engine.start(bpm, beats, sound, handleBeat);
    } else {
      engine.stop();
      setActiveBeat(-1);
    }
    return () => engine.stop();
  }, [playing]);

  useEffect(() => { if (playing) engine.setBpm(bpm); }, [bpm, playing]);
  useEffect(() => { if (playing) engine.setBeats(beats); }, [beats, playing]);
  useEffect(() => { if (playing) engine.setSound(sound); }, [sound, playing]);

  const handleTap = useTapTempo((tappedBpm) => {
    setBpm(tappedBpm);
    if (playing) engine.setBpm(tappedBpm);
  });

  // BPM drag
  const handleMouseDown = (e) => {
    dragStart.current = { y: e.clientY, bpm: bpmRef.current };
    setDragging(true);
  };
  const handleMouseMove = useCallback((e) => {
    if (!dragStart.current) return;
    const delta = Math.round((dragStart.current.y - e.clientY) / 2);
    const newBpm = Math.min(300, Math.max(20, dragStart.current.bpm + delta));
    setBpm(newBpm);
    if (playing) engine.setBpm(newBpm);
  }, [playing]);
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

  // Touch drag for BPM
  const handleTouchStart = (e) => {
    dragStart.current = { y: e.touches[0].clientY, bpm: bpmRef.current };
  };
  const handleTouchMove = (e) => {
    if (!dragStart.current) return;
    const delta = Math.round((dragStart.current.y - e.touches[0].clientY) / 2);
    const newBpm = Math.min(300, Math.max(20, dragStart.current.bpm + delta));
    setBpm(newBpm);
    if (playing) engine.setBpm(newBpm);
  };

  const tempoLabel = bpm < 60 ? "Larghetto" : bpm < 76 ? "Andante" : bpm < 108 ? "Moderato" : bpm < 132 ? "Allegro" : bpm < 168 ? "Presto" : "Prestissimo";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0e0e0f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Mono', 'Courier New', monospace",
      padding: "24px",
      userSelect: "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Bebas+Neue&display=swap');
        * { box-sizing: border-box; }
        .beat-pip { transition: background 0.05s, box-shadow 0.05s; }
        .btn-sound { transition: all 0.12s; }
        .btn-sound:hover { background: #2a2a2c !important; }
        .play-btn { transition: all 0.12s; }
        .play-btn:hover { transform: scale(1.04); }
        .play-btn:active { transform: scale(0.97); }
        .tap-btn:active { background: #2a2a2c !important; transform: scale(0.97); }
        .bpm-display { cursor: ns-resize; }
        .bpm-display:active { opacity: 0.85; }
        .time-btn:hover { border-color: #e8e0d0 !important; color: #e8e0d0 !important; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 6, color: "#555", marginBottom: 4 }}>
          POCKET CLICK
        </div>
      </div>

      {/* BPM Display */}
      <div
        className="bpm-display"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 8, padding: "16px 48px", borderRadius: 4,
          background: "#141416", border: "1px solid #222",
        }}
      >
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 96, lineHeight: 1, letterSpacing: 2,
          color: playing ? "#e8c97a" : "#e8e0d0",
          transition: "color 0.2s",
          minWidth: 200, textAlign: "center",
        }}>
          {bpm}
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#444", marginTop: 2, fontFamily: "'DM Mono', monospace" }}>
          BPM — DRAG TO ADJUST
        </div>
      </div>
      <div style={{ fontSize: 11, color: "#555", letterSpacing: 3, marginBottom: 36, fontFamily: "'DM Mono', monospace" }}>
        {tempoLabel.toUpperCase()}
      </div>

      {/* BPM nudge buttons */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
        {[-10, -1, +1, +10].map(d => (
          <button
            key={d}
            onClick={() => {
              const n = Math.min(300, Math.max(20, bpm + d));
              setBpm(n);
              if (playing) engine.setBpm(n);
            }}
            style={{
              background: "#141416", border: "1px solid #2a2a2c",
              color: "#888", fontFamily: "'DM Mono', monospace",
              fontSize: 12, padding: "8px 14px", borderRadius: 3,
              cursor: "pointer", letterSpacing: 1,
              transition: "all 0.1s",
            }}
            onMouseEnter={e => { e.target.style.color = "#e8e0d0"; e.target.style.borderColor = "#444"; }}
            onMouseLeave={e => { e.target.style.color = "#888"; e.target.style.borderColor = "#2a2a2c"; }}
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {/* Beat indicators */}
      <div style={{ display: "flex", gap: 10, marginBottom: 40 }}>
        {Array.from({ length: beats }).map((_, i) => (
          <div
            key={i}
            className="beat-pip"
            style={{
              width: i === 0 ? 18 : 14,
              height: i === 0 ? 18 : 14,
              borderRadius: "50%",
              background: activeBeat === i
                ? i === 0 ? "#e8c97a" : "#888"
                : "#1e1e20",
              border: `1px solid ${i === 0 ? "#444" : "#2a2a2c"}`,
              boxShadow: activeBeat === i
                ? i === 0 ? "0 0 12px #e8c97a88" : "0 0 8px #55555588"
                : "none",
              marginTop: i === 0 ? 0 : 2,
            }}
          />
        ))}
      </div>

      {/* Play / Tap row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 36 }}>
        <button
          className="tap-btn"
          onClick={handleTap}
          style={{
            background: "#141416", border: "1px solid #2a2a2c",
            color: "#888", fontFamily: "'DM Mono', monospace",
            fontSize: 11, letterSpacing: 3,
            padding: "14px 22px", borderRadius: 3,
            cursor: "pointer", transition: "all 0.1s",
          }}
          onMouseEnter={e => { e.target.style.color = "#e8e0d0"; e.target.style.borderColor = "#444"; }}
          onMouseLeave={e => { e.target.style.color = "#888"; e.target.style.borderColor = "#2a2a2c"; }}
        >
          TAP
        </button>

        <button
          className="play-btn"
          onClick={() => setPlaying(p => !p)}
          style={{
            width: 88, height: 52,
            background: playing ? "#e8c97a" : "#1e1e20",
            border: playing ? "1px solid #e8c97a" : "1px solid #333",
            borderRadius: 3, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s",
          }}
        >
          {playing ? (
            // Pause icon
            <div style={{ display: "flex", gap: 5 }}>
              <div style={{ width: 4, height: 18, background: "#0e0e0f", borderRadius: 1 }} />
              <div style={{ width: 4, height: 18, background: "#0e0e0f", borderRadius: 1 }} />
            </div>
          ) : (
            // Play icon
            <div style={{
              width: 0, height: 0,
              borderTop: "10px solid transparent",
              borderBottom: "10px solid transparent",
              borderLeft: "18px solid #e8e0d0",
              marginLeft: 4,
            }} />
          )}
        </button>
      </div>

      {/* Time signature */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", marginBottom: 10, textAlign: "center" }}>
          BEATS PER BAR
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {TIME_SIGS.map(n => (
            <button
              key={n}
              className="time-btn"
              onClick={() => setBeats(n)}
              style={{
                width: 36, height: 36,
                background: beats === n ? "#e8c97a" : "#141416",
                border: `1px solid ${beats === n ? "#e8c97a" : "#2a2a2c"}`,
                color: beats === n ? "#0e0e0f" : "#666",
                fontFamily: "'DM Mono', monospace",
                fontSize: 13, fontWeight: 500,
                borderRadius: 3, cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Sound selector */}
      <div>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#444", marginBottom: 10, textAlign: "center" }}>
          SOUND
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {SOUNDS.map(s => (
            <button
              key={s.id}
              className="btn-sound"
              onClick={() => setSound(s.id)}
              style={{
                padding: "8px 14px",
                background: sound === s.id ? "#e8c97a" : "#141416",
                border: `1px solid ${sound === s.id ? "#e8c97a" : "#2a2a2c"}`,
                color: sound === s.id ? "#0e0e0f" : "#666",
                fontFamily: "'DM Mono', monospace",
                fontSize: 10, letterSpacing: 2,
                borderRadius: 3, cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {s.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 48, fontSize: 10, color: "#2a2a2c", letterSpacing: 3 }}>
        POCKET CLICK — NO ADS. NO BS.
      </div>
    </div>
  );
}
