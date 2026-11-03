"use client";

import { useEffect } from "react";
import { PRIVACY_URL } from "@/lib/appInfo";

/** Canonical policy on ethandoes.com; redirect old /privacy bookmarks. */
export default function PrivacyPage() {
  useEffect(() => {
    window.location.replace(PRIVACY_URL);
  }, []);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0e0e0f",
        color: "#888",
        fontFamily: "'DM Mono', monospace",
        fontSize: 12,
      }}
    >
      <a href={PRIVACY_URL} style={{ color: "#e8c97a" }}>
        Privacy policy
      </a>
    </main>
  );
}
