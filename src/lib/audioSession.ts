import { Capacitor, registerPlugin } from "@capacitor/core";

interface AudioSessionPlugin {
  activate(): Promise<void>;
}

const NativeAudioSession = registerPlugin<AudioSessionPlugin>("AudioSession");

export function isNativeIos(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
}

/** Sets AVAudioSession to playback so Web Audio is audible with the mute switch on. */
export function activateNativeAudioSession(): Promise<void> {
  if (!isNativeIos()) return Promise.resolve();
  return NativeAudioSession.activate();
}
