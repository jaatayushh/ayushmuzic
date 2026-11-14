// =====================================================
// AyushMuzic Tizen TV — Audio Player Engine v2.0
// Dual-engine: Samsung AVPlay (TV) + HTML5 Audio (browser)
// Full queue, shuffle, repeat, like, seek support
// =====================================================

const AudioPlayer = {
    // State
    queue: [],
    currentIndex: -1,
    isPlaying: false,
    shuffle: false,
    repeatMode: 0,   // 0=off, 1=repeat-all, 2=repeat-one
    duration: 0,
    currentTime: 0,
    _shuffledOrder: [],

    // Engine
    _audio: null,
    _avplay: false,
    _loading: false,

    // Callbacks
    onTrackChange: null,
    onProgress: null,
    onStateChange: null,
    onQueueChange: null,
    onError: null,

    get currentTrack() {
        const idx = this.shuffle ? this._shuffledOrder[this.currentIndex] : this.currentIndex;
        return this.queue[idx] ?? null;
    },

    // ── Init ──────────────────────────────────────────
    init() {
        if (window.webapis && window.webapis.avplay) {
            this._avplay = true;
            console.log('[Player] Samsung AVPlay detected');
            this._initAVPlay();
        } else {
            console.log('[Player] Using HTML5 Audio');
            this._initHTML5();
        }
    },

    _initHTML5() {
        this._audio = new Audio();
        this._audio.crossOrigin = 'anonymous';
        this._audio.preload = 'auto';

        this._audio.addEventListener('timeupdate', () => {
            this.currentTime = this._audio.currentTime;
            this.duration = this._audio.duration || 0;
            if (this.onProgress) this.onProgress(this.currentTime, this.duration);
        });
        this._audio.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.onStateChange) this.onStateChange(true);
        });
        this._audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.onStateChange) this.onStateChange(false);
        });
        this._audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this._handleEnded();
        });
        this._audio.addEventListener('error', (e) => {
            console.error('[Player] HTML5 Audio error:', e);
            if (this.onError) this.onError('Stream error. Trying next…');
            setTimeout(() => this.playNext(), 1500);
        });
        this._audio.addEventListener('waiting', () => {
            if (this.onStateChange) this.onStateChange(this.isPlaying, true /* buffering */);
        });
        this._audio.addEventListener('canplay', () => {
            if (this.onStateChange) this.onStateChange(this.isPlaying, false);
        });
    },

    _initAVPlay() {
        try {
            webapis.avplay.open('about:blank');
            webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_AUTO_ASPECT_RATIO');
            webapis.avplay.setListener({
                onbufferingstart: () => console.log('[AVPlay] Buffering…'),
                onbufferingcomplete: () => console.log('[AVPlay] Buffer done'),
                oncurrentplaytime: (ms) => {
                    this.currentTime = ms / 1000;
                    this.duration = webapis.avplay.getDuration() / 1000;
                    if (this.onProgress) this.onProgress(this.currentTime, this.duration);
                },
                onstreamcompleted: () => { this.isPlaying = false; this._handleEnded(); },
                onerror: (err) => {
                    console.error('[AVPlay] Error:', err);
                    if (this.onError) this.onError('Playback error');
                    setTimeout(() => this.playNext(), 2000);
                }
            });
        } catch (e) {
            console.warn('[AVPlay] Init failed, falling back to HTML5', e);
            this._avplay = false;
            this._initHTML5();
        }
    },

    // ── Queue management ──────────────────────────────
    setQueue(songs, startIndex = 0) {
        this.queue = [...songs];
        this.currentIndex = startIndex;
        this._rebuildShuffle();
        if (this.onQueueChange) this.onQueueChange(this.queue, this.currentIndex);
    },

    _rebuildShuffle() {
        const order = [...Array(this.queue.length).keys()];
        // Fisher-Yates
        for (let i = order.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [order[i], order[j]] = [order[j], order[i]];
        }
        // Put current at front in shuffle mode
        const cur = this.shuffle ? this.currentIndex : 0;
        const curPos = order.indexOf(cur);
        if (curPos > 0) { [order[0], order[curPos]] = [order[curPos], order[0]]; }
        this._shuffledOrder = order;
    },

    // ── Playback ──────────────────────────────────────
    async play(song) {
        if (this._loading) return;
        this._loading = true;

        try {
            // Add to recent
            YTMusicService.addRecent(song);

            if (this.onTrackChange) this.onTrackChange(song, 'loading');

            const url = await YTMusicService.getStreamUrl(song.id);
            if (!url) throw new Error('No stream URL');

            if (this._avplay) {
                try {
                    webapis.avplay.stop();
                    webapis.avplay.close();
                    webapis.avplay.open(url);
                    webapis.avplay.prepareAsync(
                        () => {
                            webapis.avplay.play();
                            this.isPlaying = true;
                            if (this.onStateChange) this.onStateChange(true);
                            if (this.onTrackChange) this.onTrackChange(song, 'playing');
                        },
                        (err) => { throw new Error('AVPlay prepareAsync: ' + err); }
                    );
                } catch (e) {
                    console.error('[AVPlay] Error:', e);
                    this._avplay = false;
                    this._initHTML5();
                    await this._playHTML5(url, song);
                }
            } else {
                await this._playHTML5(url, song);
            }

        } catch (e) {
            console.error('[Player] play() failed:', e);
            if (this.onError) this.onError('Could not play. Trying next…');
            setTimeout(() => this.playNext(), 2000);
        } finally {
            this._loading = false;
        }
    },

    async _playHTML5(url, song) {
        this._audio.src = url;
        this._audio.load();
        try {
            await this._audio.play();
            if (this.onTrackChange) this.onTrackChange(song, 'playing');
        } catch (e) {
            console.error('[Player] HTML5 play rejected:', e);
            throw e;
        }
    },

    playByIndex(index) {
        if (index < 0 || index >= this.queue.length) return;
        this.currentIndex = index;
        const song = this.shuffle ? this.queue[this._shuffledOrder[index]] : this.queue[index];
        if (song) this.play(song);
    },

    togglePlayPause() {
        if (!this.currentTrack) return;
        if (this._avplay) {
            const state = webapis.avplay.getState();
            if (state === 'PLAYING') {
                webapis.avplay.pause();
                this.isPlaying = false;
                if (this.onStateChange) this.onStateChange(false);
            } else if (state === 'PAUSED' || state === 'READY') {
                webapis.avplay.play();
                this.isPlaying = true;
                if (this.onStateChange) this.onStateChange(true);
            }
        } else if (this._audio) {
            if (this._audio.paused) this._audio.play();
            else this._audio.pause();
        }
    },

    playNext() {
        if (this.queue.length === 0) return;
        if (this.repeatMode === 2) {
            // Repeat one
            this.play(this.currentTrack);
            return;
        }
        const next = this.currentIndex + 1;
        if (next >= this.queue.length) {
            if (this.repeatMode === 1) this.playByIndex(0);
            // else stop
        } else {
            this.playByIndex(next);
        }
    },

    playPrev() {
        if (this.queue.length === 0) return;
        // If more than 3s played, restart
        if (this.currentTime > 3) { this.seek(0); return; }
        const prev = this.currentIndex - 1;
        if (prev < 0) this.playByIndex(this.queue.length - 1);
        else this.playByIndex(prev);
    },

    seek(seconds) {
        if (this._avplay) {
            try { webapis.avplay.seekTo(Math.floor(seconds * 1000)); } catch {}
        } else if (this._audio) {
            this._audio.currentTime = seconds;
        }
    },

    _handleEnded() {
        if (this.onStateChange) this.onStateChange(false);
        this.playNext();
    },

    // ── Shuffle ───────────────────────────────────────
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        if (this.shuffle) this._rebuildShuffle();
        return this.shuffle;
    },

    // ── Repeat ────────────────────────────────────────
    cycleRepeat() {
        this.repeatMode = (this.repeatMode + 1) % 3;
        return this.repeatMode;
    },

    stop() {
        if (this._avplay) {
            try { webapis.avplay.stop(); } catch {}
        } else if (this._audio) {
            this._audio.pause();
            this._audio.src = '';
        }
        this.isPlaying = false;
        this.currentTime = 0;
    }
};
