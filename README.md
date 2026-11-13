<div align="center">
  <img src="composeApp/icon/circle_app_icon.png" width="140" alt="AyushMuzic Logo" style="border-radius: 28px;" />
  <h1>AyushMuzic</h1>
  <p><b>A modern, high-performance, ad-free YouTube Music client for Android, Windows, macOS, and Linux built with Compose Multiplatform.</b></p>

  <p>
    <a href="https://github.com/jaatayushh/ayushmuzic/releases"><img src="https://img.shields.io/github/v/release/jaatayushh/ayushmuzic?color=blue&style=flat-square" alt="Latest Release" /></a>
    <a href="https://github.com/jaatayushh/ayushmuzic/releases"><img src="https://img.shields.io/github/downloads/jaatayushh/ayushmuzic/total?color=success&style=flat-square" alt="Downloads" /></a>
    <a href="https://github.com/jaatayushh/ayushmuzic/stargazers"><img src="https://img.shields.io/github/stars/jaatayushh/ayushmuzic?style=flat-square" alt="Stars" /></a>
    <a href="https://github.com/jaatayushh/ayushmuzic/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-GPLv3-green.svg?style=flat-square" alt="License" /></a>
  </p>

  <h3><a href="https://github.com/jaatayushh/ayushmuzic/releases/latest">🚀 Download Latest Release (v1.0.9)</a></h3>
</div>

---

## ✨ Features

- 🎧 **Stream YouTube & YouTube Music**: Play any song, album, playlist, podcast, or music video without advertisements and in the background.
- 🎤 **Word-by-Word Synced Lyrics**: Real-time Apple Music-style animated lyrics with multi-provider synchronization (AyushMuzic Lyrics, LRCLIB, BetterLyrics, Spotify) and accurate Hindi/regional transliteration filtering.
- 🎨 **Apple SF Pro Design**: Native Apple SF Pro typography across every screen, dialog, and control for an ultra-clean, modern aesthetic.
- 🎠 **Dynamic Hero Carousel**: Beautiful curved cards for "Listen again", quick picks, and personalized recommendations, seamlessly integrated whether logged in or browsing as a guest.
- 🎚️ **10-Band Studio Equalizer**: Includes AutoEq headphone profiles, Bass Boost, Virtualizer, Reverb, Delay effects, and seamless support for phone system audio effects.
- 📴 **Offline Caching & Smart Downloads**: Download tracks and albums for offline listening anytime with flexible storage management.
- 🔊 **Cross-Platform Audio**: Native audio engine powered by media3 (Android) and mpv (Desktop) with gapless playback, crossfade, and custom audio device output.
- 📱 **Vivo Origin Island & Widgets**: Custom edition for Vivo/iQOO devices featuring interactive lockscreen/status bar Origin Island controls and interactive desktop widgets.
- 🖥️ **Desktop Library Sidebar**: Dedicated desktop layout with library management, playlists, keyboard shortcuts, and tray minimization.
- 🛡️ **SponsorBlock & Return YouTube Dislike**: Automatically skip sponsor segments, intros, and non-music interludes while seeing authentic community like/dislike ratios.
- 🎮 **Discord Rich Presence**: Share what you are listening to in real time on Discord with cover art and progress timer.
- ⏰ **Sleep Timer & Listen Together**: Set timers to gently stop music or create shared synchronized listening rooms with friends.

---

## 📥 Downloads

Grab the optimized package for your operating system from the **[Latest Release](https://github.com/jaatayushh/ayushmuzic/releases/latest)**:

### 📱 Android
| Architecture / Target | Package | Description |
| :--- | :--- | :--- |
| **arm64-v8a (Recommended)** | `AyushMuzic-v1.0.9-arm64.apk` | Best performance and smallest size for modern Android phones (99% of devices). |
| **Universal** | `AyushMuzic-v1.0.9-universal.apk` | All-in-one APK compatible with every Android device and architecture. |
| **Vivo Origin Island** | `AyushMuzic-v1.0.9-vivo-arm64.apk` | Specialized build for Vivo/iQOO OriginOS with Origin Island and widget support. |
| **armeabi-v7a** | `AyushMuzic-v1.0.9-armv7.apk` | For legacy 32-bit Android phones. |
| **x86_64** | `AyushMuzic-v1.0.9-x86_64.apk` | For Android emulators and x86_64 tablets / Chromebooks. |

### 💻 Desktop
| Platform | Format | Description |
| :--- | :--- | :--- |
| **Windows** | `AyushMuzic-v1.0.9-Setup.exe` | Complete Inno Setup installer bundling runtime, start menu shortcuts, and mpv. |
| **Windows MSI** | `AyushMuzic-v1.0.9-Setup.msi` | Native Windows Installer package for managed deployments. |
| **Windows Portable** | `AyushMuzic-v1.0.9-windows-x64.zip` | Standalone portable folder — extract and run anywhere without installing. |
| **Linux (.deb)** | `AyushMuzic-v1.0.9-linux.deb` | Debian / Ubuntu / Linux Mint / Pop!_OS package. |
| **Linux (Portable)** | `AyushMuzic-v1.0.9-linux-x64.tar.gz` | Portable distribution for all Linux distributions. |
| **macOS** | `AyushMuzic-v1.0.9-macOS.dmg` | macOS DMG package for Apple Silicon and Intel. |

---

## 🛠️ Building from Source

### Prerequisites
- **JDK 21** or later (Microsoft OpenJDK / Corretto recommended)
- **Android SDK** (for Android builds) with platform tools and build-tools `35.0.0`
- **Gradle 8.11+** (managed via `./gradlew`)
- **Inno Setup 6** (for Windows `Setup.exe` installer builds)

### Clone the Repository
```bash
git clone https://github.com/jaatayushh/ayushmuzic.git
cd ayushmuzic
```

### Build Android APKs
```bash
./gradlew :androidApp:assembleRelease
# Output: androidApp/build/outputs/apk/release/
```

### Build Windows Installer & Distributables
```bash
# Setup native MPV binaries
.\gradlew.bat :composeApp:mpvSetupAll

# Build MSI installer and standalone directory
.\gradlew.bat :desktopApp:packageReleaseMsi :desktopApp:createReleaseDistributable

# Compile Setup.exe via Inno Setup
iscc /DAppVersion=1.0.9 /DSourceDir=desktopApp\build\compose\binaries\main\app\AyushMuzic /DOutputDir=win-output /DIconFile=composeApp\icon\circle_app_icon.ico scripts\windows\installer.iss
```

### Build Linux Packages
```bash
./gradlew :composeApp:mpvSetupAll
./gradlew :desktopApp:packageReleaseDeb :desktopApp:createReleaseDistributable
```

---

## 🔒 Privacy & Legal Disclaimer

- **100% Free & Open-Source**: AyushMuzic is built purely for educational and personal use. It has zero advertisements, zero paywalls, and collects no tracking or analytics telemetry.
- **Client-Side Parsing**: AyushMuzic functions as an open-source media player and browser interface that connects directly to YouTube Music's public endpoints.
- **No Media Hosting**: AyushMuzic does not host, store, or redistribute any media or copyrighted audio files. All streams originate directly from Google/YouTube servers.
- **Support Artists**: We strongly encourage users to purchase [YouTube Premium](https://www.youtube.com/premium) and support their favorite music creators.

---

## 👨‍💻 Developer & Credits

- **Developer / Maintainer**: **jaatayushh** ([@jaatayushh](https://github.com/jaatayushh))
- **Based on**: SimpMusic by [maxrave-dev](https://github.com/maxrave-dev)
- **Lyrics Providers**: [LRCLIB](https://lrclib.net/), SimpMusic Lyrics, and Spotify
- **Stream Extraction**: [SmartTube](https://github.com/yuliskov/SmartTube), [Brave NewPipe](https://github.com/brave/brave-core), and [PipePipe](https://github.com/PipePipe-App/PipePipe-Core)
- **Community Tools**: [SponsorBlock](https://sponsor.ajay.app/) & [Return YouTube Dislike](https://returnyoutubedislike.com/)

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/jaatayushh">jaatayushh</a> using Compose Multiplatform & Kotlin.</sub>
</div>
