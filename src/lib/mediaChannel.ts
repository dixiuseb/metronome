/** Silent loop — keeps iOS on the media audio route (see Metronome / spec). */
const SILENT_MP3 =
  "data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAADAAAGhgBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr///////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRAmHAAAAAAD/+xDEAAvAAAGkAAAAIAAANIAAAARMQU1FMy45OC4xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//uQZAAAAAGkAAAAAAAA0gAAAAAAABpAGkqJAAAc0gAAABjBExBTUUzLjEyMDKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7kGQADAPAAAGkAAAAIAAANIAAAARMQU1FMy44LDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV";

let mediaChannelAudio: HTMLAudioElement | null = null;

function createMediaChannelElement(): HTMLAudioElement {
  const audio = document.createElement("audio");
  audio.setAttribute("playsinline", "");
  audio.setAttribute("webkit-playsinline", "true");
  audio.setAttribute("x-webkit-airplay", "deny");
  audio.preload = "auto";
  audio.loop = true;
  audio.volume = 0.01;
  audio.src = SILENT_MP3;
  audio.style.display = "none";
  document.body.appendChild(audio);
  return audio;
}

function disposeMediaChannel() {
  if (!mediaChannelAudio) return;
  mediaChannelAudio.pause();
  mediaChannelAudio.remove();
  mediaChannelAudio = null;
}

/**
 * Call from a user gesture (play tap). Fresh element avoids a stale loop after other apps used audio.
 * Never rejects — Web Audio can still run if the loop fails.
 */
export function startMediaChannelForPlay(): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();

  disposeMediaChannel();
  mediaChannelAudio = createMediaChannelElement();

  return mediaChannelAudio.play().then(
    () => {},
    () => {
      disposeMediaChannel();
      mediaChannelAudio = createMediaChannelElement();
      return mediaChannelAudio.play().then(
        () => {},
        () => {},
      );
    },
  );
}

/** Best-effort resume while already playing (e.g. background); must not throw. */
export function resumeMediaChannelIfPaused(): void {
  if (typeof document === "undefined" || !mediaChannelAudio?.paused) return;
  void mediaChannelAudio.play().catch(() => {});
}

export function stopMediaChannel() {
  if (!mediaChannelAudio || mediaChannelAudio.paused) return;
  mediaChannelAudio.pause();
  mediaChannelAudio.currentTime = 0;
}
