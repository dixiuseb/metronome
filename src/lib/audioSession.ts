import { Capacitor, registerPlugin } from "@capacitor/core";

interface AudioSessionPlugin {
  activate(): Promise<void>;
}

const NativeAudioSession = registerPlugin<AudioSessionPlugin>("AudioSession");

export function isNativeIos(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/**
 * WKWebView Web Audio uses the *web* audio session (separate from native AVAudioSession).
 * iOS 17+ — tell WebKit to treat output as playback (ignores mute switch).
 * @see https://nattog.dev/blog/web-audio-ios-unmute
 */
export function setWebAudioPlaybackSession(): void {
  if (typeof navigator === "undefined" || !("audioSession" in navigator)) return;
  try {
    (
      navigator as Navigator & { audioSession: { type: string } }
    ).audioSession.type = "playback";
  } catch {
    /* unsupported WebKit version */
  }
}

/** App-level AVAudioSession; supplementary — Web Audio still needs web-side session + media loop. */
export function activateNativeAudioSession(): Promise<void> {
  if (!isNativeIos()) return Promise.resolve();
  return NativeAudioSession.activate().catch(() => {
    /* Native setActive often fails when WKWebView already owns audio; web path still works. */
  });
}
