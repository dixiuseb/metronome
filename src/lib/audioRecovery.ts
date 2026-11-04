import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/** True after the app has been backgrounded at least once (not on cold launch). */
let appHasBackgrounded = false;
/** Next Play tap should rebuild Web Audio + media loop (Instagram, other metronomes, etc.). */
let pendingPlayRecovery = false;

export function consumePlayRecoveryAfterBackground(): boolean {
  if (!pendingPlayRecovery) return false;
  pendingPlayRecovery = false;
  return true;
}

/**
 * Mark that we need a deep audio reset on the next Play — only after returning from background.
 * Does not call play(); safe on foreground transitions.
 */
export function watchBackgroundForAudioRecovery(): () => void {
  const onBackground = () => {
    appHasBackgrounded = true;
  };
  const onForeground = () => {
    if (appHasBackgrounded) pendingPlayRecovery = true;
  };

  if (Capacitor.isNativePlatform()) {
    let remove: (() => void) | undefined;
    void App.addListener("appStateChange", ({ isActive }) => {
      if (isActive) onForeground();
      else onBackground();
    }).then((handle) => {
      remove = () => void handle.remove();
    });
    return () => remove?.();
  }

  const onVisibility = () => {
    if (document.visibilityState === "hidden") onBackground();
    else onForeground();
  };
  document.addEventListener("visibilitychange", onVisibility);
  return () => document.removeEventListener("visibilitychange", onVisibility);
}
