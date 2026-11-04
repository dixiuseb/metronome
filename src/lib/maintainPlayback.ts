import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { setWebAudioPlaybackSession } from "@/lib/audioSession";

/** Re-assert WebKit playback type while playing in background (avoid spamming native setActive). */
export function maintainWebAudioSession(): void {
  setWebAudioPlaybackSession();
}

/**
 * While the metronome is playing, keep audio alive when the screen locks or the app backgrounds.
 * Returns a cleanup function.
 */
export function watchPlaybackWhilePlaying(
  isPlaying: () => boolean,
  onMaintain: () => void,
): () => void {
  const run = () => {
    if (!isPlaying()) return;
    onMaintain();
  };

  document.addEventListener("visibilitychange", run);

  let removeAppListener: (() => void) | undefined;
  if (Capacitor.isNativePlatform()) {
    void App.addListener("appStateChange", () => run()).then((handle) => {
      removeAppListener = () => void handle.remove();
    });
  }

  return () => {
    document.removeEventListener("visibilitychange", run);
    removeAppListener?.();
  };
}
