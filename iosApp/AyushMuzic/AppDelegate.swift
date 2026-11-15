import UIKit
import AVFoundation
import MediaPlayer

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // 1. Configure Background Audio Session
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default, options: [.allowAirPlay, .allowBluetooth, .allowBluetoothA2DP])
            try session.setActive(true)
        } catch {
            print("Failed to activate background audio session: \(error.localizedDescription)")
        }

        // 2. Setup Native Window & Root View Controller
        window = UIWindow(frame: UIScreen.main.bounds)
        let mainVC = ViewController()
        window?.rootViewController = mainVC
        window?.backgroundColor = .black
        window?.makeKeyAndVisible()

        // 3. Register for Remote Media Key Events
        application.beginReceivingRemoteControlEvents()

        return true
    }

    func applicationWillTerminate(_ application: UIApplication) {
        UIApplication.shared.endReceivingRemoteControlEvents()
    }
}
