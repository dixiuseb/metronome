"use client";

import Link from "next/link";
import { useEffect } from "react";
import { APP_NAME, PRIVACY_PATH, SUPPORT_EMAIL } from "@/lib/appInfo";

type HelpOverlayProps = {
  open: boolean;
  onClose: () => void;
};

const TIPS: { title: string; body: string }[] = [
  {
    title: "Tempo (BPM)",
    body: "Drag the big number up or down to change speed. Use the ±1 and ±10 buttons for small steps.",
  },
  {
    title: "Tap tempo",
    body: "Tap TAP a few times in rhythm to match the current beat.",
  },
  {
    title: "Play / pause",
    body: "The center button starts and stops the click. Beat one is always accented.",
  },
  {
    title: "Practice timer",
    body: "Drag the clock up or down (when paused) to set a countdown—0:00 means off. Values snap to 15 seconds. Pause freezes the timer; it stops the metronome at zero.",
  },
  {
    title: "Accents",
    body: "Tap a beat dot to cycle normal → medium → strong accent on that beat.",
  },
  {
    title: "Time signature",
    body: "Choose 2–8 beats per bar while paused. The dot row updates to match.",
  },
];

export default function HelpOverlay({ open, onClose }: HelpOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      aria-labelledby="help-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(0, 0, 0, 0.72)",
        touchAction: "none",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 380,
          maxHeight: "min(85dvh, 640px)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          background: "#141416",
          border: "1px solid #2a2a2c",
          borderRadius: 4,
          padding: "22px 22px 18px",
          fontFamily: "'DM Mono', 'Courier New', monospace",
          color: "#e8e0d0",
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div>
            <h2
              id="help-title"
              style={{
                margin: 0,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 22,
                letterSpacing: 4,
                fontWeight: 400,
              }}
            >
              HOW TO USE
            </h2>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 11,
                color: "#666",
                letterSpacing: 1,
                lineHeight: 1.5,
              }}
            >
              {APP_NAME} — simple practice metronome. No account, no ads.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              flexShrink: 0,
              background: "transparent",
              border: "1px solid #333",
              color: "#888",
              width: 32,
              height: 32,
              borderRadius: 3,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <ul
          style={{
            margin: "0 0 20px",
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {TIPS.map((tip) => (
            <li key={tip.title}>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: 2,
                  color: "#e8c97a",
                  marginBottom: 4,
                }}
              >
                {tip.title.toUpperCase()}
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  lineHeight: 1.55,
                  color: "#aaa",
                }}
              >
                {tip.body}
              </p>
            </li>
          ))}
        </ul>

        <div
          style={{
            borderTop: "1px solid #222",
            paddingTop: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            fontSize: 12,
          }}
        >
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            style={{ color: "#e8e0d0", textDecoration: "none" }}
          >
            Support — {SUPPORT_EMAIL}
          </a>
          <Link
            href={PRIVACY_PATH}
            onClick={onClose}
            style={{ color: "#888", textDecoration: "underline" }}
          >
            Privacy policy
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: 18,
            width: "100%",
            background: "#e8c97a",
            border: "1px solid #e8c97a",
            color: "#0e0e0f",
            fontFamily: "'DM Mono', monospace",
            fontSize: 11,
            letterSpacing: 3,
            padding: "12px 16px",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
