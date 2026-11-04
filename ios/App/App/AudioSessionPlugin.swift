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
        // Best-effort: WKWebView owns the web audio session; native activation may fail on device.
        AudioSessionSupport.activatePlayback()
        call.resolve()
    }
}

enum AudioSessionSupport {
    /// Configures app-level playback category. Web Audio still relies on the web session + media loop.
    static func activatePlayback() {
        let session = AVAudioSession.sharedInstance()
        let options: AVAudioSession.CategoryOptions = [.mixWithOthers, .allowBluetoothA2DP]

        do {
            try session.setCategory(.playback, mode: .default, options: options)
        } catch {
            NSLog("[AudioSession] setCategory failed: \(error.localizedDescription)")
            do {
                try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
            } catch {
                NSLog("[AudioSession] setCategory (fallback) failed: \(error.localizedDescription)")
            }
        }

        do {
            try session.setActive(true, options: [])
        } catch {
            // Common on device when WebContent already activated its session — clicks still work via WebKit.
            NSLog("[AudioSession] setActive failed (non-fatal): \(error.localizedDescription)")
        }
    }
}
