// AyushMuzic Tizen Smart TV Main Application Controller
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
        grid.innerHTML = '<div style="color: #a0a0ab; font-size: 20px;">Searching YouTube Music...</div>';

        const results = await YTMusicService.search(query);
        if (results.length === 0) {
            grid.innerHTML = '<div style="color: #a0a0ab; font-size: 20px;">No tracks found. Try another query.</div>';
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
        grid.innerHTML = '<div style="color: #a0a0ab; font-size: 20px;">Loading Top Charts...</div>';
        const trending = await YTMusicService.getTrending();
        this.renderCardsGrid(trending, grid);
    },

    renderCardsGrid(songs, container) {
        container.innerHTML = '';
        songs.forEach((song, idx) => {
            const card = document.createElement('div');
            card.className = 'song-card focusable';
            card.innerHTML = `
                <div class="thumb-wrapper">
                    <img src="${song.thumb}" alt="${song.title}" loading="lazy">
                </div>
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
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