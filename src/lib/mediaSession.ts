import { APP_NAME } from "@/lib/appInfo";

function iconUrl(relativePath: string): string {
  return new URL(relativePath, window.location.href).href;
}

export function updateMediaSession(playing: boolean, bpm: number): void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: APP_NAME,
      artist: playing ? `${bpm} BPM` : "Ready",
      album: "Metronome",
      artwork: [
        {
          src: iconUrl("/icons/apple-touch-icon.png"),
          sizes: "180x180",
          type: "image/png",
        },
        {
          src: iconUrl("/icons/icon-192.png"),
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: iconUrl("/icons/icon-512.png"),
          sizes: "512x512",
          type: "image/png",
        },
      ],
    });
  } catch {
    /* MediaMetadata unsupported */
  }

  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}

/** Lock-screen / Control Center play & pause (wired to metronome transport). */
export function bindMediaSessionTransport(handlers: {
  onPlay: () => void;
  onPause: () => void;
}): () => void {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
    return () => {};
  }

  navigator.mediaSession.setActionHandler("play", () => handlers.onPlay());
  navigator.mediaSession.setActionHandler("pause", () => handlers.onPause());

  return () => {
    try {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    } catch {
      /* ignore */
    }
  };
}
