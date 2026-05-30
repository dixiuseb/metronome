export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0e0f",
        color: "#888",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        padding: 24,
        textAlign: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 13,
          letterSpacing: 6,
          color: "#555",
        }}
      >
        POCKET CLICK
      </div>
      <p style={{ fontSize: 12, letterSpacing: 2, margin: 0 }}>
        YOU&apos;RE OFFLINE
      </p>
      <p style={{ fontSize: 11, letterSpacing: 1, margin: 0, maxWidth: 280 }}>
        Reconnect to load the app. Previously visited pages may still be
        available.
      </p>
    </div>
  );
}
