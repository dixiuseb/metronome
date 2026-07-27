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
        do {
            try AudioSessionSupport.activatePlayback()
            call.resolve()
        } catch {
            call.reject("Failed to activate audio session", nil, error)
        }
    }
}

enum AudioSessionSupport {
    static func activatePlayback() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try session.setActive(true)
    }
}
