import os
import zipfile

tizen_dir = r"c:\Users\AYUSH\Downloads\SimpMusic-dev\SimpMusic-dev\tizenApp"
css_dir = os.path.join(tizen_dir, "css")
js_dir = os.path.join(tizen_dir, "js")
os.makedirs(css_dir, exist_ok=True)
os.makedirs(js_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. config.xml
# -------------------------------------------------------------
config_xml = """<?xml version="1.0" encoding="UTF-8"?>
<widget xmlns="http://www.w3.org/ns/widgets" 
        xmlns:tizen="http://tizen.org/ns/widgets" 
        id="http://ayushmuzic.com/tizen/AyushMuzic" 
        version="1.0.0" 
        viewmodes="maximized">
    <tizen:application id="AyushMuzic.AyushMuzic" package="AyushMuzic" exec="index.html" screen-orientation="landscape" context-menu="enable" background-support="enable"/>
    <name>AyushMuzic</name>
    <tizen:profile name="tv-samsung"/>
    <icon src="icon.png"/>
    <author email="jaatayushh@users.noreply.github.com" href="https://github.com/jaatayushh">Ayush</author>
    <description>AyushMuzic - Cross-Platform YouTube Music Client for Samsung Smart TV (Tizen OS)</description>
    <tizen:privilege name="http://tizen.org/privilege/internet"/>
    <tizen:privilege name="http://tizen.org/privilege/tv.audio"/>
    <tizen:privilege name="http://developer.samsung.com/privilege/avplay"/>
    <tizen:privilege name="http://developer.samsung.com/privilege/network.public"/>
    <tizen:privilege name="http://tizen.org/privilege/application.launch"/>
    <tizen:privilege name="http://tizen.org/privilege/tv.inputdevice"/>
    <tizen:setting screen-orientation="landscape" context-menu="enable" background-support="enable" encryption="disable" install-location="auto"/>
    <access origin="*" subdomains="true"/>
    <tizen:metadata key="http://samsung.com/tv/metadata/use.multiscreen" value="false"/>
</widget>"""

with open(os.path.join(tizen_dir, "config.xml"), "w", encoding="utf-8") as f:
    f.write(config_xml.strip())
print("1/6: Created config.xml")

# -------------------------------------------------------------
# 2. css/tv-style.css
# -------------------------------------------------------------
tv_css = """/* AyushMuzic Tizen Smart TV 10-Foot Design */
:root {
    --bg-main: #0a0a0e;
    --bg-card: rgba(255, 255, 255, 0.05);
    --bg-card-hover: rgba(255, 255, 255, 0.12);
    --accent: #ff2d55;
    --accent-glow: rgba(255, 45, 85, 0.6);
    --text-primary: #ffffff;
    --text-secondary: #a0a0ab;
    --sidebar-width: 260px;
    --miniplayer-height: 90px;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    user-select: none;
    -webkit-user-select: none;
}

body {
    background-color: var(--bg-main);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    font-size: 18px;
}

/* TV Focus Styling */
.focusable {
    outline: none;
    transition: transform 0.2s cubic-bezier(0.2, 0.9, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    border: 2px solid transparent;
}

.focusable.focused {
    transform: scale(1.08);
    border-color: var(--accent) !important;
    box-shadow: 0 0 24px var(--accent-glow), 0 8px 32px rgba(0, 0, 0, 0.7) !important;
    z-index: 100;
}

/* App Container */
#app-container {
    display: flex;
    width: 100vw;
    height: 100vh;
    background: radial-gradient(circle at 10% 20%, rgba(255, 45, 85, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(138, 43, 226, 0.08) 0%, transparent 40%),
                var(--bg-main);
}

/* Sidebar */
#sidebar {
    width: var(--sidebar-width);
    height: 100vh;
    background: rgba(15, 15, 20, 0.85);
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    padding: 36px 20px;
    gap: 36px;
    z-index: 10;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 16px;
    padding-left: 12px;
}

.logo-icon {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff2d55, #ff7a00);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(255, 45, 85, 0.4);
}

.logo-icon svg {
    width: 24px;
    height: 24px;
    fill: #ffffff;
}

.logo-text {
    font-size: 24px;
    font-weight: 800;
    letter-spacing: 0.5px;
    background: linear-gradient(90deg, #ffffff, #f0f0f0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nav-menu {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 16px 20px;
    border-radius: 14px;
    color: var(--text-secondary);
    font-size: 20px;
    font-weight: 600;
    cursor: pointer;
    background: transparent;
}

.nav-item svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
}

.nav-item.active {
    color: #ffffff;
    background: rgba(255, 45, 85, 0.15);
}

.nav-item.focused {
    color: #ffffff;
    background: var(--accent);
}

.nav-item.focused svg {
    fill: #ffffff;
}

/* Main Content Area */
#main-content {
    flex: 1;
    height: 100vh;
    overflow-y: hidden;
    padding: 36px 48px;
    padding-bottom: calc(var(--miniplayer-height) + 36px);
    position: relative;
}

.view-section {
    display: none;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    padding-right: 12px;
}

.view-section::-webkit-scrollbar {
    width: 6px;
}
.view-section::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
}

.view-section.active {
    display: block;
}

.section-header {
    font-size: 32px;
    font-weight: 800;
    margin-bottom: 24px;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.section-subtitle {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-top: 4px;
}

/* Cards Grid */
.cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 24px;
    padding-bottom: 40px;
}

.song-card {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 16px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 12px;
    border: 2px solid transparent;
}

.song-card .thumb-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    background: #181820;
}

.song-card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.song-card .song-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.song-card .song-artist {
    font-size: 15px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* Search Bar & On-Screen TV Keyboard */
.search-header-container {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
}

.search-input-box {
    flex: 1;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 22px;
    color: #ffffff;
}

.search-input-box svg {
    width: 28px;
    height: 28px;
    fill: var(--text-secondary);
}

.search-input-text {
    flex: 1;
    outline: none;
    border: none;
    background: transparent;
    color: #ffffff;
    font-size: 22px;
}

.tv-keyboard {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 10px;
    margin-bottom: 28px;
    background: rgba(20, 20, 28, 0.7);
    padding: 20px;
    border-radius: 18px;
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.key-btn {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
}

.key-btn.wide-2 { grid-column: span 2; }
.key-btn.wide-3 { grid-column: span 3; }
.key-btn.wide-4 { grid-column: span 4; }

/* Mini Player Bar */
#mini-player {
    position: fixed;
    bottom: 0;
    left: var(--sidebar-width);
    right: 0;
    height: var(--miniplayer-height);
    background: rgba(18, 18, 24, 0.95);
    backdrop-filter: blur(24px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 40px;
    z-index: 50;
}

.mini-info {
    display: flex;
    align-items: center;
    gap: 18px;
    width: 320px;
}

.mini-thumb {
    width: 58px;
    height: 58px;
    border-radius: 10px;
    object-fit: cover;
    background: #252530;
}

.mini-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow: hidden;
}

.mini-title {
    font-size: 18px;
    font-weight: 700;
    color: #ffffff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mini-artist {
    font-size: 14px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.mini-controls {
    display: flex;
    align-items: center;
    gap: 20px;
}

.ctrl-btn {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.ctrl-btn.play-pause-btn {
    width: 56px;
    height: 56px;
    background: var(--accent);
}

.ctrl-btn svg {
    width: 24px;
    height: 24px;
    fill: #ffffff;
}

.mini-progress-box {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 400px;
}

.progress-bar-bg {
    flex: 1;
    height: 6px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
}

.progress-bar-fill {
    height: 100%;
    width: 0%;
    background: var(--accent);
    border-radius: 3px;
    transition: width 0.3s linear;
}

.time-text {
    font-size: 14px;
    color: var(--text-secondary);
    font-family: monospace;
}

/* Fullscreen Now Playing Overlay */
#fullscreen-player {
    position: fixed;
    inset: 0;
    background: #08080c;
    z-index: 200;
    display: none;
    flex-direction: column;
    padding: 60px 80px;
}

#fullscreen-player.active {
    display: flex;
}

.player-backdrop {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center;
    filter: blur(80px) brightness(0.25);
    z-index: 1;
}

.player-content {
    position: relative;
    z-index: 2;
    display: flex;
    height: 100%;
    align-items: center;
    gap: 80px;
}

.player-artwork-box {
    width: 440px;
    height: 440px;
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 45, 85, 0.2);
}

.player-artwork-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.player-meta-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 36px;
}

.player-song-title {
    font-size: 48px;
    font-weight: 800;
    color: #ffffff;
    line-height: 1.2;
}

.player-song-artist {
    font-size: 28px;
    color: var(--text-secondary);
    font-weight: 500;
}

.player-controls-row {
    display: flex;
    align-items: center;
    gap: 30px;
    margin-top: 16px;
}

.player-btn {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
}

.player-btn.primary {
    width: 80px;
    height: 80px;
    background: var(--accent);
    box-shadow: 0 8px 32px var(--accent-glow);
}

.player-btn svg {
    width: 32px;
    height: 32px;
    fill: #ffffff;
}

.player-back-btn {
    position: absolute;
    top: 40px;
    left: 40px;
    z-index: 10;
    padding: 12px 24px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
}

/* Equalizer Bars Animation */
.eq-bars {
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 24px;
}
.eq-bar {
    width: 4px;
    background: var(--accent);
    border-radius: 2px;
    animation: eq-bounce 1s infinite ease-in-out alternate;
}
.eq-bar:nth-child(1) { height: 8px; animation-delay: 0.1s; }
.eq-bar:nth-child(2) { height: 18px; animation-delay: 0.3s; }
.eq-bar:nth-child(3) { height: 12px; animation-delay: 0.2s; }
.eq-bar:nth-child(4) { height: 22px; animation-delay: 0.4s; }

@keyframes eq-bounce {
    0% { height: 6px; }
    100% { height: 24px; }
}
"""

with open(os.path.join(css_dir, "tv-style.css"), "w", encoding="utf-8") as f:
    f.write(tv_css.strip())
print("2/6: Created css/tv-style.css")

# -------------------------------------------------------------
# 3. index.html
# -------------------------------------------------------------
tv_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=1920, height=1080, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AyushMuzic TV</title>
    <link rel="stylesheet" href="css/tv-style.css">
</head>
<body>
    <div id="app-container">
        <!-- Sidebar Navigation -->
        <nav id="sidebar">
            <div class="logo-container">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                </div>
                <div class="logo-text">AyushMuzic</div>
            </div>

            <div class="nav-menu">
                <div class="nav-item focusable active" data-view="home" id="nav-home">
                    <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                    <span>Home</span>
                </div>
                <div class="nav-item focusable" data-view="search" id="nav-search">
                    <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    <span>Search</span>
                </div>
                <div class="nav-item focusable" data-view="trending" id="nav-trending">
                    <svg viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                    <span>Trending</span>
                </div>
                <div class="nav-item focusable" id="nav-nowplaying">
                    <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
                    <span>Player</span>
                </div>
            </div>
        </nav>

        <!-- Main Content Area -->
        <main id="main-content">
            <!-- Home Section -->
            <section id="view-home" class="view-section active">
                <div class="section-header">
                    <div>
                        <div class="header-title">Recommended for TV</div>
                        <div class="section-subtitle">Top hits, trending songs, and fresh releases</div>
                    </div>
                </div>
                <div class="cards-grid" id="home-grid">
                    <!-- Song Cards injected by JS -->
                </div>
            </section>

            <!-- Search Section -->
            <section id="view-search" class="view-section">
                <div class="search-header-container">
                    <div class="search-input-box focusable" id="search-box">
                        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                        <input type="text" id="search-input" class="search-input-text" placeholder="Search songs, artists, albums..." readonly>
                    </div>
                </div>

                <!-- Onscreen Virtual Keyboard for TV Remote -->
                <div class="tv-keyboard" id="tv-keyboard">
                    <div class="key-btn focusable" data-key="A">A</div>
                    <div class="key-btn focusable" data-key="B">B</div>
                    <div class="key-btn focusable" data-key="C">C</div>
                    <div class="key-btn focusable" data-key="D">D</div>
                    <div class="key-btn focusable" data-key="E">E</div>
                    <div class="key-btn focusable" data-key="F">F</div>
                    <div class="key-btn focusable" data-key="G">G</div>
                    <div class="key-btn focusable" data-key="H">H</div>
                    <div class="key-btn focusable" data-key="I">I</div>
                    <div class="key-btn focusable" data-key="J">J</div>

                    <div class="key-btn focusable" data-key="K">K</div>
                    <div class="key-btn focusable" data-key="L">L</div>
                    <div class="key-btn focusable" data-key="M">M</div>
                    <div class="key-btn focusable" data-key="N">N</div>
                    <div class="key-btn focusable" data-key="O">O</div>
                    <div class="key-btn focusable" data-key="P">P</div>
                    <div class="key-btn focusable" data-key="Q">Q</div>
                    <div class="key-btn focusable" data-key="R">R</div>
                    <div class="key-btn focusable" data-key="S">S</div>
                    <div class="key-btn focusable" data-key="T">T</div>

                    <div class="key-btn focusable" data-key="U">U</div>
                    <div class="key-btn focusable" data-key="V">V</div>
                    <div class="key-btn focusable" data-key="W">W</div>
                    <div class="key-btn focusable" data-key="X">X</div>
                    <div class="key-btn focusable" data-key="Y">Y</div>
                    <div class="key-btn focusable" data-key="Z">Z</div>
                    <div class="key-btn focusable" data-key="1">1</div>
                    <div class="key-btn focusable" data-key="2">2</div>
                    <div class="key-btn focusable" data-key="3">3</div>
                    <div class="key-btn focusable" data-key="4">4</div>

                    <div class="key-btn focusable wide-2" data-key="SPACE">SPACE</div>
                    <div class="key-btn focusable wide-2" data-key="BACKSPACE">⌫ DEL</div>
                    <div class="key-btn focusable wide-2" data-key="CLEAR">CLEAR</div>
                    <div class="key-btn focusable wide-4" data-key="SEARCH" style="background: var(--accent);">SEARCH 🔍</div>
                </div>

                <div class="section-header">
                    <div class="header-title">Search Results</div>
                </div>
                <div class="cards-grid" id="search-grid">
                    <!-- Search Results Injected by JS -->
                </div>
            </section>

            <!-- Trending Section -->
            <section id="view-trending" class="view-section">
                <div class="section-header">
                    <div>
                        <div class="header-title">Global Top Charts</div>
                        <div class="section-subtitle">Most played music videos and tracks right now</div>
                    </div>
                </div>
                <div class="cards-grid" id="trending-grid">
                    <!-- Trending injected by JS -->
                </div>
            </section>
        </main>

        <!-- Bottom Mini Player -->
        <div id="mini-player">
            <div class="mini-info">
                <img id="mini-thumb" class="mini-thumb" src="icon.png" alt="Thumb">
                <div class="mini-meta">
                    <div id="mini-title" class="mini-title">No song playing</div>
                    <div id="mini-artist" class="mini-artist">Select a song to start</div>
                </div>
            </div>

            <div class="mini-controls">
                <div class="ctrl-btn focusable" id="ctrl-prev">
                    <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </div>
                <div class="ctrl-btn focusable play-pause-btn" id="ctrl-play-pause">
                    <svg id="ctrl-play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="ctrl-btn focusable" id="ctrl-next">
                    <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </div>
            </div>

            <div class="mini-progress-box">
                <span class="time-text" id="mini-current-time">0:00</span>
                <div class="progress-bar-bg focusable" id="mini-progress">
                    <div class="progress-bar-fill" id="mini-progress-fill"></div>
                </div>
                <span class="time-text" id="mini-total-time">0:00</span>
            </div>
        </div>

        <!-- Fullscreen Now Playing Overlay -->
        <div id="fullscreen-player">
            <div class="player-backdrop" id="player-backdrop"></div>
            <div class="player-back-btn focusable" id="player-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                <span>Back to TV (Return)</span>
            </div>
            <div class="player-content">
                <div class="player-artwork-box">
                    <img id="player-art" src="icon.png" alt="Cover">
                </div>
                <div class="player-meta-box">
                    <div>
                        <div class="player-song-title" id="player-title">Song Title</div>
                        <div class="player-song-artist" id="player-artist">Artist Name</div>
                    </div>

                    <div class="mini-progress-box" style="width: 100%;">
                        <span class="time-text" id="player-current-time" style="font-size: 18px;">0:00</span>
                        <div class="progress-bar-bg focusable" id="player-progress-bar" style="height: 10px;">
                            <div class="progress-bar-fill" id="player-progress-fill"></div>
                        </div>
                        <span class="time-text" id="player-total-time" style="font-size: 18px;">0:00</span>
                    </div>

                    <div class="player-controls-row">
                        <div class="player-btn focusable" id="player-prev-btn">
                            <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                        </div>
                        <div class="player-btn primary focusable" id="player-play-btn">
                            <svg id="player-play-icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                        <div class="player-btn focusable" id="player-next-btn">
                            <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                        </div>
                        <div class="eq-bars" style="margin-left: 20px;">
                            <div class="eq-bar"></div>
                            <div class="eq-bar"></div>
                            <div class="eq-bar"></div>
                            <div class="eq-bar"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Application Scripts -->
    <script src="js/ytmusic.js"></script>
    <script src="js/player.js"></script>
    <script src="js/navigation.js"></script>
    <script src="js/app.js"></script>
</body>
</html>"""

with open(os.path.join(tizen_dir, "index.html"), "w", encoding="utf-8") as f:
    f.write(tv_html.strip())
print("3/6: Created index.html")

# -------------------------------------------------------------
# 4. js/ytmusic.js (YouTube Music + Invidious Stream Client)
# -------------------------------------------------------------
ytmusic_js = """// YouTube Music & Stream Resolver Service for Tizen Smart TV
const YTMusicService = {
    // Invidious public API instances for fast, unthrottled, direct audio stream extraction
    instances: [
        'https://inv.nadeko.net',
        'https://invidious.nerdvpn.de',
        'https://invidious.projectsegfau.lt',
        'https://yt.drgnz.club'
    ],
    currentInstanceIndex: 0,

    getBaseUrl() {
        return this.instances[this.currentInstanceIndex];
    },

    rotateInstance() {
        this.currentInstanceIndex = (this.currentInstanceIndex + 1) % this.instances.length;
        console.log('[YTMusic] Rotated to:', this.getBaseUrl());
    },

    // Curated high quality starter songs for TV home view
    getDefaultHits() {
        return [
            { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg' },
            { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', thumb: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg' },
            { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumb: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg' },
            { id: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', thumb: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg' },
            { id: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', thumb: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg' },
            { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumb: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg' },
            { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', thumb: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg' },
            { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', thumb: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg' },
            { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', thumb: 'https://i.ytimg.com/vi/CevxZvSJLk8/hqdefault.jpg' },
            { id: 'k2qgadSvNyU', title: 'New Rules', artist: 'Dua Lipa', thumb: 'https://i.ytimg.com/vi/k2qgadSvNyU/hqdefault.jpg' },
            { id: 'SlPhMPnQ58k', title: 'Memories', artist: 'Maroon 5', thumb: 'https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg' },
            { id: 'nfWlot6h_JM', title: 'Shake It Off', artist: 'Taylor Swift', thumb: 'https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg' }
        ];
    },

    // Search for tracks
    async search(query) {
        if (!query || !query.trim()) return [];
        for (let i = 0; i < this.instances.length; i++) {
            const baseUrl = this.getBaseUrl();
            try {
                const url = `${baseUrl}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
                const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const data = await resp.json();
                return data.slice(0, 20).map(item => ({
                    id: item.videoId,
                    title: item.title,
                    artist: item.author || 'Unknown Artist',
                    thumb: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
                }));
            } catch (err) {
                console.warn('[YTMusic] Search error with instance:', baseUrl, err.message);
                this.rotateInstance();
            }
        }
        return [];
    },

    // Get Top / Trending Tracks
    async getTrending() {
        for (let i = 0; i < this.instances.length; i++) {
            const baseUrl = this.getBaseUrl();
            try {
                const url = `${baseUrl}/api/v1/trending?type=music`;
                const resp = await fetch(url, { signal: AbortSignal.timeout(6000) });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const data = await resp.json();
                return data.slice(0, 24).map(item => ({
                    id: item.videoId,
                    title: item.title,
                    artist: item.author || 'Unknown Artist',
                    thumb: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
                }));
            } catch (err) {
                console.warn('[YTMusic] Trending error with instance:', baseUrl, err.message);
                this.rotateInstance();
            }
        }
        return this.getDefaultHits();
    },

    // Resolve direct playable audio stream URL
    async getAudioStreamUrl(videoId) {
        for (let i = 0; i < this.instances.length; i++) {
            const baseUrl = this.getBaseUrl();
            try {
                const url = `${baseUrl}/api/v1/videos/${videoId}`;
                const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const data = await resp.json();
                
                // Find best audio stream (m4a or webm/opus)
                const audioStreams = data.adaptiveFormats?.filter(f => f.type && f.type.startsWith('audio/')) || [];
                if (audioStreams.length > 0) {
                    audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
                    return audioStreams[0].url;
                }
                // Fallback to progressive format
                if (data.formatStreams && data.formatStreams.length > 0) {
                    return data.formatStreams[0].url;
                }
            } catch (err) {
                console.warn('[YTMusic] Stream error with instance:', baseUrl, err.message);
                this.rotateInstance();
            }
        }
        // Direct fallback proxy
        return `https://inv.nadeko.net/latest_version?id=${videoId}&itag=140`;
    }
};
"""

with open(os.path.join(js_dir, "ytmusic.js"), "w", encoding="utf-8") as f:
    f.write(ytmusic_js.strip())
print("4/6: Created js/ytmusic.js")

# -------------------------------------------------------------
# 5. js/player.js (Dual Playback Engine: Tizen AVPlay + HTML5)
# -------------------------------------------------------------
player_js = """// Dual-Engine Music Player for Tizen Smart TV & Browser
const AudioPlayer = {
    audioElement: null,
    isTizenAVPlay: false,
    currentTrack: null,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    onTrackChange: null,
    onTimeUpdate: null,
    onStateChange: null,

    init() {
        // Detect if Samsung Tizen AVPlay API is present on TV
        if (window.webapis && window.webapis.avplay) {
            this.isTizenAVPlay = true;
            console.log('[AudioPlayer] Running on Samsung Smart TV with webapis.avplay');
            this.initTizenAVPlay();
        } else {
            this.isTizenAVPlay = false;
            console.log('[AudioPlayer] Running with standard HTML5 Audio');
            this.audioElement = new Audio();
            this.audioElement.addEventListener('timeupdate', () => {
                this.currentTime = this.audioElement.currentTime;
                this.duration = this.audioElement.duration || 0;
                if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime, this.duration);
            });
            this.audioElement.addEventListener('play', () => {
                this.isPlaying = true;
                if (this.onStateChange) this.onStateChange(true);
            });
            this.audioElement.addEventListener('pause', () => {
                this.isPlaying = false;
                if (this.onStateChange) this.onStateChange(false);
            });
            this.audioElement.addEventListener('ended', () => {
                this.isPlaying = false;
                if (this.onStateChange) this.onStateChange(false);
                if (window.App && window.App.playNext) window.App.playNext();
            });
        }
    },

    initTizenAVPlay() {
        try {
            webapis.avplay.open('about:blank');
            webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');
            webapis.avplay.setListener({
                onbufferingstart: () => console.log('[AVPlay] Buffering started'),
                onbufferingcomplete: () => console.log('[AVPlay] Buffering finished'),
                oncurrentplaytime: (timeMs) => {
                    this.currentTime = timeMs / 1000;
                    this.duration = webapis.avplay.getDuration() / 1000;
                    if (this.onTimeUpdate) this.onTimeUpdate(this.currentTime, this.duration);
                },
                onstreamcompleted: () => {
                    this.isPlaying = false;
                    if (this.onStateChange) this.onStateChange(false);
                    if (window.App && window.App.playNext) window.App.playNext();
                },
                onerror: (err) => console.error('[AVPlay] Playback Error:', err)
            });
        } catch (e) {
            console.warn('[AVPlay] Failed to initialize AVPlay, falling back to HTML5 audio:', e);
            this.isTizenAVPlay = false;
            this.audioElement = new Audio();
        }
    },

    async playTrack(track) {
        this.currentTrack = track;
        if (this.onTrackChange) this.onTrackChange(track);

        try {
            const streamUrl = await YTMusicService.getAudioStreamUrl(track.id);
            console.log('[AudioPlayer] Resolved audio stream for:', track.title);

            if (this.isTizenAVPlay) {
                try {
                    webapis.avplay.stop();
                    webapis.avplay.open(streamUrl);
                    webapis.avplay.prepareAsync(() => {
                        webapis.avplay.play();
                        this.isPlaying = true;
                        if (this.onStateChange) this.onStateChange(true);
                    }, (err) => {
                        console.error('[AVPlay] prepareAsync failed:', err);
                    });
                } catch (err) {
                    console.error('[AVPlay] playTrack error:', err);
                }
            } else if (this.audioElement) {
                this.audioElement.src = streamUrl;
                await this.audioElement.play();
            }
        } catch (e) {
            console.error('[AudioPlayer] Failed to play track:', e);
        }
    },

    togglePlayPause() {
        if (!this.currentTrack) return;
        if (this.isTizenAVPlay) {
            const state = webapis.avplay.getState();
            if (state === 'PLAYING') {
                webapis.avplay.pause();
                this.isPlaying = false;
                if (this.onStateChange) this.onStateChange(false);
            } else {
                webapis.avplay.play();
                this.isPlaying = true;
                if (this.onStateChange) this.onStateChange(true);
            }
        } else if (this.audioElement) {
            if (this.audioElement.paused) {
                this.audioElement.play();
            } else {
                this.audioElement.pause();
            }
        }
    },

    seekTo(seconds) {
        if (this.isTizenAVPlay) {
            webapis.avplay.seekTo(seconds * 1000);
        } else if (this.audioElement) {
            this.audioElement.currentTime = seconds;
        }
    }
};
"""

with open(os.path.join(js_dir, "player.js"), "w", encoding="utf-8") as f:
    f.write(player_js.strip())
print("5/6: Created js/player.js")

# -------------------------------------------------------------
# 6. js/navigation.js & js/app.js (Spatial Navigation & UI)
# -------------------------------------------------------------
navigation_js = """// Spatial D-Pad Navigation Engine for Samsung Smart TV Remote
const TVNavigation = {
    currentFocus: null,

    init() {
        // Register Tizen TV Remote Keys
        this.registerTizenKeys();

        // Listen for keyboard events (works with both TV remote & PC keyboard)
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Initial focus on first sidebar item
        const firstFocus = document.querySelector('.focusable');
        if (firstFocus) {
            this.setFocus(firstFocus);
        }
    },

    registerTizenKeys() {
        if (window.tizen && tizen.tvinputdevice) {
            const keysToRegister = [
                'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
                'MediaFastForward', 'MediaRewind', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
            ];
            keysToRegister.forEach(key => {
                try {
                    tizen.tvinputdevice.registerKey(key);
                } catch (e) {
                    console.log('[TVNav] Key registration ignored for:', key);
                }
            });
        }
    },

    setFocus(element) {
        if (!element) return;
        if (this.currentFocus) {
            this.currentFocus.classList.remove('focused');
        }
        this.currentFocus = element;
        this.currentFocus.classList.add('focused');

        // Smooth scroll element into view if inside a scrollable container
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    },

    handleKeyDown(e) {
        const keyCode = e.keyCode;
        const key = e.key;

        // Tizen Return / Back Button (keyCode 10009 or Backspace)
        if (keyCode === 10009 || key === 'Backspace') {
            e.preventDefault();
            if (window.App && window.App.handleBack) {
                window.App.handleBack();
            }
            return;
        }

        // Tizen Media Remote Keys
        if (keyCode === 415 || key === 'MediaPlay') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }
        if (keyCode === 19 || key === 'MediaPause') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }
        if (keyCode === 10252 || key === 'MediaPlayPause') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }

        // D-Pad Directional Navigation
        switch (key) {
            case 'ArrowUp':
                e.preventDefault();
                this.moveFocus('up');
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.moveFocus('down');
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.moveFocus('left');
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.moveFocus('right');
                break;
            case 'Enter':
                e.preventDefault();
                if (this.currentFocus) {
                    this.currentFocus.click();
                }
                break;
        }
    },

    moveFocus(direction) {
        if (!this.currentFocus) {
            const first = document.querySelector('.focusable');
            if (first) this.setFocus(first);
            return;
        }

        const visibleFocusables = Array.from(document.querySelectorAll('.focusable')).filter(el => {
            return el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
        });

        const currentRect = this.currentFocus.getBoundingClientRect();
        let bestCandidate = null;
        let bestDistance = Infinity;

        visibleFocusables.forEach(candidate => {
            if (candidate === this.currentFocus) return;
            const candRect = candidate.getBoundingClientRect();

            let isValid = false;
            let primaryDist = 0;
            let secondaryDist = 0;

            if (direction === 'up' && candRect.bottom <= currentRect.top + 10) {
                isValid = true;
                primaryDist = currentRect.top - candRect.bottom;
                secondaryDist = Math.abs((candRect.left + candRect.width / 2) - (currentRect.left + currentRect.width / 2));
            } else if (direction === 'down' && candRect.top >= currentRect.bottom - 10) {
                isValid = true;
                primaryDist = candRect.top - currentRect.bottom;
                secondaryDist = Math.abs((candRect.left + candRect.width / 2) - (currentRect.left + currentRect.width / 2));
            } else if (direction === 'left' && candRect.right <= currentRect.left + 10) {
                isValid = true;
                primaryDist = currentRect.left - candRect.right;
                secondaryDist = Math.abs((candRect.top + candRect.height / 2) - (currentRect.top + currentRect.height / 2));
            } else if (direction === 'right' && candRect.left >= currentRect.right - 10) {
                isValid = true;
                primaryDist = candRect.left - currentRect.right;
                secondaryDist = Math.abs((candRect.top + candRect.height / 2) - (currentRect.top + currentRect.height / 2));
            }

            if (isValid) {
                const totalDist = primaryDist * 1.5 + secondaryDist;
                if (totalDist < bestDistance) {
                    bestDistance = totalDist;
                    bestCandidate = candidate;
                }
            }
        });

        if (bestCandidate) {
            this.setFocus(bestCandidate);
        }
    }
};
"""

with open(os.path.join(js_dir, "navigation.js"), "w", encoding="utf-8") as f:
    f.write(navigation_js.strip())

app_js = """// AyushMuzic Tizen Smart TV Main Application Controller
const App = {
    currentQueue: [],
    currentIndex: -1,
    currentSearchQuery: '',

    init() {
        console.log('[AyushMuzic] Initializing TV Application...');
        AudioPlayer.init();
        TVNavigation.init();
        this.bindEvents();
        this.loadHomeSongs();
    },

    bindEvents() {
        // Navigation sidebar items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const view = item.dataset.view;
                if (view) {
                    this.switchView(view);
                } else if (item.id === 'nav-nowplaying') {
                    this.openFullscreenPlayer();
                }
            });
        });

        // Mini player controls
        document.getElementById('ctrl-play-pause').addEventListener('click', () => AudioPlayer.togglePlayPause());
        document.getElementById('ctrl-next').addEventListener('click', () => this.playNext());
        document.getElementById('ctrl-prev').addEventListener('click', () => this.playPrev());
        document.getElementById('mini-player').addEventListener('click', (e) => {
            if (!e.target.closest('.ctrl-btn')) {
                this.openFullscreenPlayer();
            }
        });

        // Fullscreen player controls
        document.getElementById('player-play-btn').addEventListener('click', () => AudioPlayer.togglePlayPause());
        document.getElementById('player-next-btn').addEventListener('click', () => this.playNext());
        document.getElementById('player-prev-btn').addEventListener('click', () => this.playPrev());
        document.getElementById('player-close-btn').addEventListener('click', () => this.closeFullscreenPlayer());

        // Virtual On-Screen TV Keyboard
        document.querySelectorAll('.key-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleVirtualKey(btn.dataset.key));
        });

        // AudioPlayer Listeners
        AudioPlayer.onTrackChange = (track) => this.updateUIOnTrackChange(track);
        AudioPlayer.onTimeUpdate = (current, duration) => this.updateUIOnTimeUpdate(current, duration);
        AudioPlayer.onStateChange = (isPlaying) => this.updateUIOnStateChange(isPlaying);
    },

    switchView(viewName) {
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navEl = document.getElementById('nav-' + viewName);
        if (navEl) navEl.classList.add('active');

        document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
        const targetSection = document.getElementById('view-' + viewName);
        if (targetSection) {
            targetSection.classList.add('active');
            if (viewName === 'trending') {
                this.loadTrendingSongs();
            }
            // Move focus to first card in view
            setTimeout(() => {
                const firstCard = targetSection.querySelector('.focusable');
                if (firstCard) TVNavigation.setFocus(firstCard);
            }, 100);
        }
    },

    handleVirtualKey(key) {
        const input = document.getElementById('search-input');
        if (key === 'SPACE') {
            this.currentSearchQuery += ' ';
        } else if (key === 'BACKSPACE') {
            this.currentSearchQuery = this.currentSearchQuery.slice(0, -1);
        } else if (key === 'CLEAR') {
            this.currentSearchQuery = '';
        } else if (key === 'SEARCH') {
            this.executeSearch(this.currentSearchQuery);
            return;
        } else {
            this.currentSearchQuery += key;
        }
        input.value = this.currentSearchQuery;
    },

    async executeSearch(query) {
        if (!query.trim()) return;
        const grid = document.getElementById('search-grid');
        grid.innerHTML = '<div style=\"color: #a0a0ab; font-size: 20px;\">Searching YouTube Music...</div>';

        const results = await YTMusicService.search(query);
        if (results.length === 0) {
            grid.innerHTML = '<div style=\"color: #a0a0ab; font-size: 20px;\">No tracks found. Try another query.</div>';
            return;
        }
        this.renderCardsGrid(results, grid);
    },

    async loadHomeSongs() {
        const grid = document.getElementById('home-grid');
        const defaultSongs = YTMusicService.getDefaultHits();
        this.renderCardsGrid(defaultSongs, grid);
    },

    async loadTrendingSongs() {
        const grid = document.getElementById('trending-grid');
        if (grid.children.length > 0) return;
        grid.innerHTML = '<div style=\"color: #a0a0ab; font-size: 20px;\">Loading Top Charts...</div>';
        const trending = await YTMusicService.getTrending();
        this.renderCardsGrid(trending, grid);
    },

    renderCardsGrid(songs, container) {
        container.innerHTML = '';
        songs.forEach((song, idx) => {
            const card = document.createElement('div');
            card.className = 'song-card focusable';
            card.innerHTML = `
                <div class=\"thumb-wrapper\">
                    <img src=\"${song.thumb}\" alt=\"${song.title}\" loading=\"lazy\">
                </div>
                <div class=\"song-title\">${song.title}</div>
                <div class=\"song-artist\">${song.artist}</div>
            `;
            card.addEventListener('click', () => {
                this.currentQueue = songs;
                this.currentIndex = idx;
                AudioPlayer.playTrack(song);
            });
            container.appendChild(card);
        });
    },

    playNext() {
        if (this.currentQueue.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.currentQueue.length;
        AudioPlayer.playTrack(this.currentQueue[this.currentIndex]);
    },

    playPrev() {
        if (this.currentQueue.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.currentQueue.length) % this.currentQueue.length;
        AudioPlayer.playTrack(this.currentQueue[this.currentIndex]);
    },

    openFullscreenPlayer() {
        if (!AudioPlayer.currentTrack) return;
        const player = document.getElementById('fullscreen-player');
        player.classList.add('active');
        const playBtn = document.getElementById('player-play-btn');
        if (playBtn) TVNavigation.setFocus(playBtn);
    },

    closeFullscreenPlayer() {
        const player = document.getElementById('fullscreen-player');
        player.classList.remove('active');
        const miniPlayBtn = document.getElementById('ctrl-play-pause');
        if (miniPlayBtn) TVNavigation.setFocus(miniPlayBtn);
    },

    handleBack() {
        const fsPlayer = document.getElementById('fullscreen-player');
        if (fsPlayer.classList.contains('active')) {
            this.closeFullscreenPlayer();
            return;
        }
        // If in search or trending, return to home
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.dataset.view !== 'home') {
            this.switchView('home');
            return;
        }
        // Exit application on Samsung TV
        if (window.tizen && tizen.application) {
            tizen.application.getCurrentApplication().exit();
        }
    },

    updateUIOnTrackChange(track) {
        document.getElementById('mini-title').textContent = track.title;
        document.getElementById('mini-artist').textContent = track.artist;
        document.getElementById('mini-thumb').src = track.thumb;

        document.getElementById('player-title').textContent = track.title;
        document.getElementById('player-artist').textContent = track.artist;
        document.getElementById('player-art').src = track.thumb;
        document.getElementById('player-backdrop').style.backgroundImage = `url('${track.thumb}')`;
    },

    updateUIOnTimeUpdate(current, duration) {
        const pct = duration > 0 ? (current / duration) * 100 : 0;
        document.getElementById('mini-progress-fill').style.width = pct + '%';
        document.getElementById('player-progress-fill').style.width = pct + '%';

        const fmtCurrent = this.formatTime(current);
        const fmtDuration = this.formatTime(duration);
        document.getElementById('mini-current-time').textContent = fmtCurrent;
        document.getElementById('mini-total-time').textContent = fmtDuration;
        document.getElementById('player-current-time').textContent = fmtCurrent;
        document.getElementById('player-total-time').textContent = fmtDuration;
    },

    updateUIOnStateChange(isPlaying) {
        const playPath = 'M8 5v14l11-7z';
        const pausePath = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
        const path = isPlaying ? pausePath : playPath;
        document.getElementById('ctrl-play-icon').querySelector('path').setAttribute('d', path);
        document.getElementById('player-play-icon').querySelector('path').setAttribute('d', path);
    },

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }
};

window.addEventListener('load', () => App.init());
"""

with open(os.path.join(js_dir, "app.js"), "w", encoding="utf-8") as f:
    f.write(app_js.strip())
print("6/6: Created js/navigation.js & js/app.js")

# -------------------------------------------------------------
# 7. package-wgt.py (Creates AyushMuzic-Tizen.wgt)
# -------------------------------------------------------------
wgt_output = os.path.join(tizen_dir, "AyushMuzic-Tizen.wgt")
with zipfile.ZipFile(wgt_output, "w", zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(tizen_dir):
        for file in files:
            if file.endswith(".wgt"):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, tizen_dir)
            zf.write(full_path, rel_path)

print(f"Packaged AyushMuzic-Tizen.wgt successfully ({os.path.getsize(wgt_output)} bytes)")
