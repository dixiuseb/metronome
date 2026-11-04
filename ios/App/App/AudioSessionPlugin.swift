import AVFoundation
import Capacitor

@objc(AudioSessionPlugin)
public class AudioSessionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "AudioSessionPlugin"
    public let jsName = "AudioSession"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "activate", returnType: CAPPluginReturnPromise),
    ]

    @objc func activate(_ call: CAPPluginCall) {
        AudioSessionSupport.activatePlayback()
        call.resolve()
    }
}

enum AudioSessionSupport {
    /// Best-effort. Re-setting category while WebKit owns the session causes OSStatus -50 after other apps (Spotify, etc.).
    static func activatePlayback() {
        let session = AVAudioSession.sharedInstance()
        do {
            if session.category != .playback {
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            }
            try session.setActive(true, options: [])
        } catch {
            NSLog("[AudioSession] activatePlayback (non-fatal): \(error.localizedDescription)")
        }
    }
}
