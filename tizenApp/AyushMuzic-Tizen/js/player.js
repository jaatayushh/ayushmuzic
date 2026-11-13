// Dual-Engine Music Player for Tizen Smart TV & Browser
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