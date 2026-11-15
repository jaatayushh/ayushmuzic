import UIKit
import WebKit
import MediaPlayer
import AVFoundation

class ViewController: UIViewController, WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler {

    private var webView: WKWebView!
    private var nowPlayingInfo = [String: Any]()

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black

        setupWebView()
        setupRemoteControls()
        loadLocalApp()
    }

    // ════════════════════════════════════════════════════════════════
    // 1. SETUP HIGH-PERFORMANCE WKWEBVIEW
    // ════════════════════════════════════════════════════════════════
    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.preferences.javaScriptCanOpenWindowsAutomatically = true

        // Message handler for media sync
        let contentController = WKUserContentController()
        contentController.add(self, name: "ayushMuzicBridge")
        config.userContentController = contentController

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.backgroundColor = .black
        webView.isOpaque = true
        webView.scrollView.backgroundColor = .black
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.uiDelegate = self
        webView.navigationDelegate = self

        view.addSubview(webView)
    }

    // ════════════════════════════════════════════════════════════════
    // 2. LOAD LOCAL CLIENT BUNDLE (OR FALLBACK TO DEV SERVER)
    // ════════════════════════════════════════════════════════════════
    private func loadLocalApp() {
        if let bundlePath = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
            let readAccessURL = bundlePath.deletingLastPathComponent()
            webView.loadFileURL(bundlePath, allowingReadAccessTo: readAccessURL)
            print("Loaded local AyushMuzic client bundle.")
        } else if let localPath = Bundle.main.path(forResource: "index", ofType: "html") {
            let url = URL(fileURLWithPath: localPath)
            webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        } else {
            // Development fallback
            if let devUrl = URL(string: "http://localhost:8080") {
                webView.load(URLRequest(url: devUrl))
                print("Falling back to local network dev server.")
            }
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 3. LOCK SCREEN & HARDWARE REMOTE CONTROLS (AirPods, Apple Watch)
    // ════════════════════════════════════════════════════════════════
    private func setupRemoteControls() {
        let commandCenter = MPRemoteCommandCenter.shared()

        // Play Command
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.evaluateJS("if (window.ayushPlayerToggle) window.ayushPlayerToggle(true);")
            return .success
        }

        // Pause Command
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.evaluateJS("if (window.ayushPlayerToggle) window.ayushPlayerToggle(false);")
            return .success
        }

        // Toggle Play/Pause
        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.evaluateJS("if (window.ayushPlayerToggle) window.ayushPlayerToggle();")
            return .success
        }

        // Next Track (AirPods double tap / Lock screen)
        commandCenter.nextTrackCommand.isEnabled = true
        commandCenter.nextTrackCommand.addTarget { [weak self] _ in
            self?.evaluateJS("if (window.ayushPlayerNext) window.ayushPlayerNext();")
            return .success
        }

        // Previous Track (AirPods triple tap / Lock screen)
        commandCenter.previousTrackCommand.isEnabled = true
        commandCenter.previousTrackCommand.addTarget { [weak self] _ in
            self?.evaluateJS("if (window.ayushPlayerPrev) window.ayushPlayerPrev();")
            return .success
        }

        // Seek Bar Position
        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let positionEvent = event as? MPChangePlaybackPositionCommandEvent else { return .commandFailed }
            let targetSeconds = positionEvent.positionTime
            self?.evaluateJS("if (window.ayushPlayerSeek) window.ayushPlayerSeek(\(targetSeconds));")
            return .success
        }
    }

    private func evaluateJS(_ script: String) {
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript(script, completionHandler: nil)
        }
    }

    // ════════════════════════════════════════════════════════════════
    // 4. JAVASCRIPT TO NATIVE BRIDGE MESSAGE HANDLER
    // ════════════════════════════════════════════════════════════════
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "ayushMuzicBridge", let body = message.body as? [String: Any] else { return }

        let type = body["type"] as? String ?? ""

        switch type {
        case "trackChanged":
            let title = body["title"] as? String ?? "AyushMuzic"
            let artist = body["artist"] as? String ?? "Various Artists"
            let duration = body["duration"] as? Double ?? 240.0
            let coverUrl = body["cover"] as? String ?? ""

            updateNowPlaying(title: title, artist: artist, duration: duration, coverUrl: coverUrl)

        case "playbackState":
            let isPlaying = body["playing"] as? Bool ?? false
            let currentTime = body["currentTime"] as? Double ?? 0.0

            nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
            nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
            MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo

        default:
            break
        }
    }

    private func updateNowPlaying(title: String, artist: String, duration: Double, coverUrl: String) {
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = 0.0
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = 1.0

        if !coverUrl.isEmpty, let url = URL(string: coverUrl) {
            URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
                if let data = data, let image = UIImage(data: data) {
                    let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                    DispatchQueue.main.async {
                        self?.nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
                        MPNowPlayingInfoCenter.default().nowPlayingInfo = self?.nowPlayingInfo
                    }
                }
            }.resume()
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}
