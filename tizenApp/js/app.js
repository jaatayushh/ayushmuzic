// =====================================================
// AyushMuzic Tizen TV — Main App Controller v2.0
// Full: Home feed, search, trending, library, player
// Queue, shuffle, repeat, like, toast, hero carousel
// =====================================================

const App = {
    _searchQuery: '',
    _heroSlides: [],
    _heroIdx: 0,
    _heroTimer: null,
    _currentView: 'home',
    _libTab: 'liked',
    _trendingLoaded: false,
    _homeLoaded: false,

    // ── Bootstrap ─────────────────────────────────────
    init() {
        console.log('[AyushMuzic] Starting up…');
        AudioPlayer.init();
        TVNavigation.init();
        this._bindPlayerCallbacks();
        this._bindUIEvents();
        this._loadHome();
    },

    // ── Player callbacks ──────────────────────────────
    _bindPlayerCallbacks() {
        AudioPlayer.onTrackChange = (track, state) => this._onTrackChange(track, state);
        AudioPlayer.onProgress = (cur, dur) => this._onProgress(cur, dur);
        AudioPlayer.onStateChange = (playing, buffering) => this._onStateChange(playing, buffering);
        AudioPlayer.onQueueChange = (queue, idx) => this._onQueueChange(queue, idx);
        AudioPlayer.onError = (msg) => this.toast(msg, 'error');
    },

    // ── UI Event Binding ──────────────────────────────
    _bindUIEvents() {
        // Nav sidebar
        document.querySelectorAll('.nav-item[data-view]').forEach(item => {
            item.addEventListener('click', () => this.switchView(item.dataset.view));
        });

        // Mini player controls
        document.getElementById('ctrl-play').addEventListener('click', () => AudioPlayer.togglePlayPause());
        document.getElementById('ctrl-next').addEventListener('click', () => AudioPlayer.playNext());
        document.getElementById('ctrl-prev').addEventListener('click', () => AudioPlayer.playPrev());
        document.getElementById('ctrl-shuffle').addEventListener('click', () => this._toggleShuffle());
        document.getElementById('ctrl-repeat').addEventListener('click', () => this._cycleRepeat());
        document.getElementById('ctrl-like').addEventListener('click', () => this._toggleLike());
        document.getElementById('ctrl-queue').addEventListener('click', () => this._openPlayer());

        // Mini player click → open fullscreen
        document.getElementById('mini-info-click').addEventListener('click', () => this._openPlayer());

        // Mini seekbar click
        document.getElementById('mini-seekbar').addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            AudioPlayer.seek(pct * AudioPlayer.duration);
        });

        // Fullscreen player controls
        document.getElementById('player-close').addEventListener('click', () => this._closePlayer());
        document.getElementById('player-play').addEventListener('click', () => AudioPlayer.togglePlayPause());
        document.getElementById('player-next').addEventListener('click', () => AudioPlayer.playNext());
        document.getElementById('player-prev').addEventListener('click', () => AudioPlayer.playPrev());
        document.getElementById('player-shuffle').addEventListener('click', () => this._toggleShuffle());
        document.getElementById('player-repeat').addEventListener('click', () => this._cycleRepeat());
        document.getElementById('player-like').addEventListener('click', () => this._toggleLike());
        document.getElementById('player-queue-toggle').addEventListener('click', () => this._toggleQueuePanel());

        // Fullscreen seekbar
        document.getElementById('player-seekbar').addEventListener('click', (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            AudioPlayer.seek(pct * AudioPlayer.duration);
        });

        // Virtual keyboard
        document.querySelectorAll('.key-btn').forEach(btn => {
            btn.addEventListener('click', () => this._onKeyboardKey(btn.dataset.key));
        });

        // Library tabs
        document.querySelectorAll('.lib-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.lib-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this._libTab = tab.dataset.lib;
                this._renderLibrary();
            });
        });

        // Hero carousel
        document.getElementById('hero-carousel').addEventListener('click', () => {
            const slide = this._heroSlides[this._heroIdx];
            if (slide) this._playSong(slide, this._heroSlides);
        });
    },

    // ── View switching ────────────────────────────────
    switchView(view) {
        if (view === 'nowplaying') { this._openPlayer(); return; }
        this._currentView = view;

        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
        const navEl = document.getElementById('nav-' + view);
        if (navEl) navEl.classList.add('active');

        document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
        const section = document.getElementById('view-' + view);
        if (section) section.classList.add('active');

        if (view === 'trending' && !this._trendingLoaded) this._loadTrending();
        if (view === 'library') this._renderLibrary();

        // Focus first card after render
        setTimeout(() => {
            const first = section?.querySelector('.focusable');
            if (first) TVNavigation.setFocus(first);
        }, 120);
    },

    handleBack() {
        const player = document.getElementById('fullscreen-player');
        if (player.classList.contains('active')) { this._closePlayer(); return; }

        if (this._currentView !== 'home') { this.switchView('home'); return; }

        // On home with Back → exit app (Samsung Tizen)
        if (window.tizen && tizen.application) {
            tizen.application.getCurrentApplication().exit();
        }
    },

    // ── Home Feed ────────────────────────────────────
    async _loadHome() {
        if (this._homeLoaded) return;
        this._homeLoaded = true;

        // Load hero + rows in parallel
        const [feed, trending] = await Promise.all([
            YTMusicService.getHomeFeed(),
            YTMusicService.getTrending(32).catch(() => [])
        ]);

        const all = feed.length > 0 ? feed : YTMusicService.getDefaultHits();

        // Hero carousel: top 6
        this._heroSlides = all.slice(0, 6);
        this._buildHeroCarousel(this._heroSlides);

        // Quick picks row
        this._buildRow('quick-picks-row', all.slice(0, 12), all);

        // Hot now row (from trending)
        const hotSource = trending.length > 0 ? trending : all;
        this._buildRow('hot-now-row', hotSource.slice(0, 12), hotSource);

        // Recommended row (rest of feed, skip first 12)
        const recs = all.length > 12 ? all.slice(12) : YTMusicService.getDefaultHits().slice(6);
        this._buildRow('recommended-row', recs.slice(0, 12), recs);
    },

    _buildHeroCarousel(slides) {
        const track = document.getElementById('hero-track');
        const dots = document.getElementById('hero-dots');
        track.innerHTML = '';
        dots.innerHTML = '';

        slides.forEach((song, i) => {
            const slide = document.createElement('div');
            slide.className = 'hero-slide';
            slide.innerHTML = `
                <div class="hero-bg" style="background-image: url('${song.thumb}')"></div>
                <div class="hero-content">
                    <img class="hero-art" src="${song.thumb}" alt="${this._esc(song.title)}" onerror="this.src='icon.png'">
                    <div class="hero-meta">
                        <div class="hero-badge">🎵 Featured</div>
                        <div class="hero-title">${this._esc(song.title)}</div>
                        <div class="hero-artist">${this._esc(song.artist)}</div>
                        <div class="hero-play-btn">
                            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            Play Now
                        </div>
                    </div>
                </div>
            `;
            track.appendChild(slide);

            const dot = document.createElement('div');
            dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
            dots.appendChild(dot);
        });

        this._heroIdx = 0;
        this._startHeroTimer();
    },

    _startHeroTimer() {
        clearInterval(this._heroTimer);
        if (this._heroSlides.length < 2) return;
        this._heroTimer = setInterval(() => {
            this._heroIdx = (this._heroIdx + 1) % this._heroSlides.length;
            this._moveHero(this._heroIdx);
        }, 6000);
    },

    _moveHero(idx) {
        document.getElementById('hero-track').style.transform = `translateX(-${idx * 100}%)`;
        document.querySelectorAll('.hero-dot').forEach((d, i) => {
            d.classList.toggle('active', i === idx);
        });
    },

    _buildRow(containerId, songs, fullQueue) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';
        songs.forEach((song, i) => {
            const card = this._createCard(song, i, fullQueue, 'row');
            container.appendChild(card);
        });
        // After row is populated, focus first item if currently visible
    },

    // ── Trending ─────────────────────────────────────
    async _loadTrending() {
        this._trendingLoaded = true;
        const grid = document.getElementById('trending-grid');
        grid.innerHTML = '<div class="loading-spinner" style="grid-column:1/-1"><div class="spinner-ring"></div>Loading charts…</div>';

        const data = await YTMusicService.getTrending(32);
        grid.innerHTML = '';
        data.forEach((song, i) => {
            const card = this._createCard(song, i, data, 'grid');
            // Add rank badge
            const wrapper = card.querySelector('.thumb-wrapper');
            if (wrapper) {
                const badge = document.createElement('div');
                badge.className = 'rank-badge' + (i < 3 ? ' top3' : '');
                badge.textContent = '#' + (i + 1);
                wrapper.appendChild(badge);
            }
            grid.appendChild(card);
        });
    },

    // ── Library ──────────────────────────────────────
    _renderLibrary() {
        const grid = document.getElementById('library-grid');
        let songs = [];

        if (this._libTab === 'liked') {
            songs = YTMusicService.getLiked();
        } else if (this._libTab === 'recent') {
            songs = YTMusicService.getRecent();
        } else if (this._libTab === 'queue') {
            songs = AudioPlayer.queue;
        }

        grid.innerHTML = '';
        if (songs.length === 0) {
            const labels = {
                liked: ['No liked songs yet', 'Like songs while listening'],
                recent: ['Nothing played yet', 'Start listening to build history'],
                queue: ['Queue is empty', 'Play a song to build your queue']
            };
            const [t, s] = labels[this._libTab] || ['Empty', ''];
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
                <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <div class="empty-state-text">${t}</div>
                <div class="empty-state-sub">${s}</div>
            </div>`;
            return;
        }
        songs.forEach((song, i) => {
            const card = this._createCard(song, i, songs, 'grid');
            grid.appendChild(card);
        });

        // Highlight current track
        this._highlightCurrent();
    },

    // ── Card Factory ──────────────────────────────────
    _createCard(song, idx, queue, layout = 'row') {
        const card = document.createElement('div');
        card.className = 'song-card focusable' + (layout === 'row' ? '' : '');
        card.dataset.id = song.id;
        const liked = YTMusicService.isLiked(song.id);

        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${song.thumb}" alt="${this._esc(song.title)}" loading="lazy" onerror="this.src='icon.png'">
                <div class="thumb-play-overlay">
                    <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div class="now-playing-badge">▶ Playing</div>
            </div>
            <div class="song-title">${this._esc(song.title)}</div>
            <div class="song-artist">${this._esc(song.artist)}</div>
        `;

        card.addEventListener('click', () => this._playSong(song, queue, idx));
        return card;
    },

    _playSong(song, queue, startIdx) {
        const idx = startIdx !== undefined ? startIdx : (queue ? queue.indexOf(song) : 0);
        AudioPlayer.setQueue(queue || [song], Math.max(0, idx));
        AudioPlayer.play(song);
        // Auto-open player on first play if already on nowplaying nav
    },

    // ── Player UI callbacks ───────────────────────────
    _onTrackChange(track, state) {
        if (!track) return;

        // Update mini player
        document.getElementById('mini-title').textContent = track.title;
        document.getElementById('mini-artist').textContent = track.artist;
        document.getElementById('mini-thumb').src = track.thumb;

        // Update fullscreen player
        document.getElementById('player-title').textContent = track.title;
        document.getElementById('player-artist').textContent = track.artist;
        document.getElementById('player-art').src = track.thumb;
        document.getElementById('player-bg').style.backgroundImage = `url('${track.thumb}')`;
        document.getElementById('player-album').textContent = '';

        // Update like button
        this._syncLikeBtn(YTMusicService.isLiked(track.id));

        // Queue info
        const qi = AudioPlayer.currentIndex + 1;
        const qt = AudioPlayer.queue.length;
        document.getElementById('player-queue-info').textContent = `Queue • ${qi} / ${qt}`;

        // Highlight current in all grids
        this._highlightCurrent();

        // Update queue panel
        this._renderQueuePanel();
    },

    _onProgress(cur, dur) {
        const pct = dur > 0 ? (cur / dur) * 100 : 0;
        document.getElementById('mini-fill').style.width = pct + '%';
        document.getElementById('player-fill').style.width = pct + '%';

        const fmtCur = YTMusicService.formatTime(cur);
        const fmtDur = YTMusicService.formatTime(dur);
        document.getElementById('mini-current').textContent = fmtCur;
        document.getElementById('mini-total').textContent = fmtDur;
        document.getElementById('player-current').textContent = fmtCur;
        document.getElementById('player-total').textContent = fmtDur;
    },

    _onStateChange(playing, buffering) {
        const playPath = 'M8 5v14l11-7z';
        const pausePath = 'M6 19h4V5H6v14zm8-14v14h4V5h-4z';
        const path = playing ? pausePath : playPath;

        const ctrlIcon = document.getElementById('ctrl-play-icon');
        const playerIcon = document.getElementById('player-play-icon');
        if (ctrlIcon) ctrlIcon.querySelector('path').setAttribute('d', path);
        if (playerIcon) playerIcon.querySelector('path').setAttribute('d', path);

        // EQ bars
        const eq = document.getElementById('player-eq');
        if (eq) eq.classList.toggle('paused', !playing);
    },

    _onQueueChange(queue, idx) {
        this._renderQueuePanel();
    },

    // ── Queue Panel ───────────────────────────────────
    _renderQueuePanel() {
        const list = document.getElementById('queue-list');
        const queue = AudioPlayer.queue;
        list.innerHTML = '';
        queue.forEach((song, i) => {
            const item = document.createElement('div');
            item.className = 'queue-item focusable' + (i === AudioPlayer.currentIndex ? ' current' : '');
            item.innerHTML = `
                <div class="queue-item-idx">${i === AudioPlayer.currentIndex ? '▶' : (i + 1)}</div>
                <img class="queue-item-thumb" src="${song.thumb}" alt="" onerror="this.src='icon.png'">
                <div class="queue-item-info">
                    <div class="queue-item-title">${this._esc(song.title)}</div>
                    <div class="queue-item-artist">${this._esc(song.artist)}</div>
                </div>
            `;
            item.addEventListener('click', () => AudioPlayer.playByIndex(i));
            list.appendChild(item);
        });
        // Scroll to current
        const cur = list.querySelector('.current');
        if (cur) cur.scrollIntoView({ block: 'nearest' });
    },

    _toggleQueuePanel() {
        this._renderQueuePanel();
        document.getElementById('queue-panel').classList.toggle('open');
    },

    // ── Open/Close fullscreen player ──────────────────
    _openPlayer() {
        if (!AudioPlayer.currentTrack && AudioPlayer.queue.length === 0) return;
        this._renderQueuePanel();
        document.getElementById('fullscreen-player').classList.add('active');
        setTimeout(() => TVNavigation.setFocus(document.getElementById('player-play')), 80);
    },

    _closePlayer() {
        document.getElementById('fullscreen-player').classList.remove('active');
        document.getElementById('queue-panel').classList.remove('open');
        setTimeout(() => TVNavigation.setFocus(document.getElementById('ctrl-play')), 80);
    },

    // ── Shuffle / Repeat / Like ───────────────────────
    _toggleShuffle() {
        const on = AudioPlayer.toggleShuffle();
        document.getElementById('ctrl-shuffle').classList.toggle('active', on);
        document.getElementById('player-shuffle').classList.toggle('active', on);
        this.toast(on ? '🔀 Shuffle On' : 'Shuffle Off');
    },

    _cycleRepeat() {
        const mode = AudioPlayer.cycleRepeat();
        const labels = ['Repeat Off', '🔁 Repeat All', '🔂 Repeat One'];
        const icons = [
            'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
            'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z',
            'M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z'
        ];
        const active = mode > 0;
        document.getElementById('ctrl-repeat').classList.toggle('active', active);
        document.getElementById('player-repeat').classList.toggle('active', active);
        this.toast(labels[mode]);
    },

    _toggleLike() {
        const track = AudioPlayer.currentTrack;
        if (!track) return;
        const isNowLiked = YTMusicService.toggleLike(track);
        this._syncLikeBtn(isNowLiked);
        this.toast(isNowLiked ? '❤️ Added to Liked Songs' : 'Removed from Liked Songs');
        // Refresh library if open
        if (this._currentView === 'library' && this._libTab === 'liked') this._renderLibrary();
    },

    _syncLikeBtn(liked) {
        document.getElementById('ctrl-like').classList.toggle('active', liked);
        document.getElementById('player-like').classList.toggle('active', liked);
    },

    // ── Highlight current track ───────────────────────
    _highlightCurrent() {
        const cur = AudioPlayer.currentTrack;
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.toggle('playing', cur && card.dataset.id === cur.id);
        });
    },

    // ── Virtual Keyboard ─────────────────────────────
    _onKeyboardKey(key) {
        if (key === 'BACKSPACE') {
            this._searchQuery = this._searchQuery.slice(0, -1);
        } else if (key === 'SPACE') {
            this._searchQuery += ' ';
        } else if (key === 'CLEAR') {
            this._searchQuery = '';
        } else if (key === 'SEARCH') {
            this._doSearch();
            return;
        } else {
            this._searchQuery += key;
        }
        this._updateSearchDisplay();
    },

    _updateSearchDisplay() {
        const display = document.getElementById('search-query-display');
        display.textContent = this._searchQuery || 'Search songs, artists, albums…';
    },

    async _doSearch() {
        const q = this._searchQuery.trim();
        if (!q) return;

        const area = document.getElementById('search-results-area');
        area.innerHTML = `<div class="loading-spinner"><div class="spinner-ring"></div>Searching YouTube Music for "${this._esc(q)}"…</div>`;

        const results = await YTMusicService.search(q);

        area.innerHTML = '';
        if (results.length === 0) {
            area.innerHTML = `<div class="empty-state">
                <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                <div class="empty-state-text">No results for "${this._esc(q)}"</div>
                <div class="empty-state-sub">Try a different search</div>
            </div>`;
            return;
        }

        const header = document.createElement('div');
        header.style.cssText = 'font-size:20px;color:#a0a0ab;margin-bottom:20px;';
        header.textContent = `${results.length} results for "${q}"`;
        area.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'cards-grid';
        results.forEach((song, i) => {
            grid.appendChild(this._createCard(song, i, results, 'grid'));
        });
        area.appendChild(grid);

        // Focus first result
        setTimeout(() => {
            const first = grid.querySelector('.focusable');
            if (first) TVNavigation.setFocus(first);
        }, 100);
    },

    // ── Toast notifications ───────────────────────────
    toast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = {
            info:    '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
            error:   '<svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
            success: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14l-4-4 1.41-1.41L10 13.17l6.59-6.59L18 8l-8 8z"/></svg>'
        };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = (icons[type] || icons.info) + `<span>${msg}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3200);
    },

    // ── Utilities ─────────────────────────────────────
    _esc(str) {
        return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
};

// Boot
window.addEventListener('load', () => App.init());
