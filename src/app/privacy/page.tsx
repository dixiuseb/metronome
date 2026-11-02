import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/appInfo";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        height: "100dvh",
        minHeight: "100dvh",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        touchAction: "pan-y",
        WebkitOverflowScrolling: "touch",
        background: "#0e0e0f",
        color: "#e8e0d0",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        padding:
          "max(28px, env(safe-area-inset-top, 0px)) 24px max(48px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div
        style={{
          margin: "auto",
          width: "100%",
          maxWidth: 560,
          lineHeight: 1.6,
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            letterSpacing: 4,
            fontWeight: 500,
            margin: "0 0 8px",
            color: "#e8e0d0",
          }}
        >
          Privacy
        </h1>
        <p style={{ margin: "0 0 24px", fontSize: 12, color: "#666" }}>
          {APP_NAME}
        </p>

        <section style={{ fontSize: 13, color: "#aaa" }}>
          <p>
            {APP_NAME} is built for practice, not data collection. The metronome
            runs on your device. We do not require an account, and we do not sell
            your information.
          </p>
          <p>
            <strong style={{ color: "#e8e0d0", fontWeight: 500 }}>
              What we collect:
            </strong>{" "}
            Nothing is sent to us for core use of the app. Tempo, timer, and
            accent settings stay on your device (browser or app storage only where
            the app saves preferences locally, such as dismissing this help
            screen).
          </p>
          <p>
            <strong style={{ color: "#e8e0d0", fontWeight: 500 }}>
              Analytics & ads:
            </strong>{" "}
            No ads. No third-party analytics in the app as shipped.
          </p>
          <p>
            <strong style={{ color: "#e8e0d0", fontWeight: 500 }}>Contact:</strong>{" "}
            Questions —{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#e8c97a" }}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p style={{ fontSize: 11, color: "#555", marginTop: 32 }}>
            Last updated: November 2026
          </p>
        </section>

        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 32,
            fontSize: 11,
            letterSpacing: 2,
            color: "#888",
            textDecoration: "none",
          }}
        >
          ← BACK
        </Link>
      </div>
    </main>
  );
}
