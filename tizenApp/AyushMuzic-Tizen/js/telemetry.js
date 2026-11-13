// AyushMuzic Universal Telemetry & Analytics Module
const AyushMuzicTelemetry = {
    APP_ID: 'ayushmuzic',
    TELEMETRY_ENDPOINT: 'https://ayushflix-admin-panel.vercel.app/api/telemetry',
    ERROR_ENDPOINT: 'https://ayushflix-admin-panel.vercel.app/api/error',
    heartbeatInterval: null,
    lastReportedStatus: null,

    getUserId() {
        let uid = localStorage.getItem('ayushmuzic_uid');
        if (!uid) {
            uid = 'tizen_' + Math.random().toString(36).substring(2, 10);
            localStorage.setItem('ayushmuzic_uid', uid);
        }
        return uid;
    },

    getProfileName() {
        try {
            const rawUser = localStorage.getItem('ayushmuzic_user');
            if (rawUser) {
                const u = JSON.parse(rawUser);
                if (u && (u.name || u.email)) return u.name || u.email;
            }
        } catch (e) {}
        return 'Ayush';
    },

    sendAsync(url, payload) {
        try {
            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(function() {
                // Fail silently without UI interruption
            });
        } catch (e) {
            // Fail silently
        }
    },

    trackProgress(track, progressSec, durationSec, status) {
        if (!track || !track.title) return;
        const dur = Math.max(1, Math.round(durationSec || track.durationSec || 210));
        const prog = Math.max(0, Math.min(dur, Math.round(progressSec || 0)));
        const percentage = Math.min(100, Math.max(0, Math.round((prog / dur) * 100)));

        const payload = {
            appId: this.APP_ID,
            eventType: 'watch_progress',
            title: track.title,
            artist: track.artist || '',
            progress: prog,
            duration: dur,
            percentage: percentage,
            platform: 'Samsung Tizen TV',
            deviceModel: 'Smart TV',
            status: status || 'playing',
            profileName: this.getProfileName(),
            userId: this.getUserId()
        };

        this.sendAsync(this.TELEMETRY_ENDPOINT, payload);
    },

    trackSearch(query) {
        if (!query || !query.trim()) return;
        const q = query.trim();
        const payload = {
            appId: this.APP_ID,
            eventType: 'search',
            query: q,
            title: q,
            profileName: this.getProfileName(),
            platform: 'Samsung Tizen TV',
            deviceModel: 'Smart TV',
            userId: this.getUserId()
        };
        this.sendAsync(this.TELEMETRY_ENDPOINT, payload);
    },

    trackClick(track) {
        if (!track || !track.title) return;
        const payload = {
            appId: this.APP_ID,
            eventType: 'click',
            title: track.title,
            artist: track.artist || '',
            profileName: this.getProfileName(),
            platform: 'Samsung Tizen TV',
            deviceModel: 'Smart TV',
            userId: this.getUserId()
        };
        this.sendAsync(this.TELEMETRY_ENDPOINT, payload);
    },

    reportError(error, sourceFile) {
        const payload = {
            appId: this.APP_ID,
            errorMessage: error && (error.message || error.toString()) || 'Unknown error',
            stackTrace: (error && error.stack) || '',
            sourceFile: sourceFile || 'player.js',
            profileName: this.getProfileName(),
            deviceModel: 'Smart TV',
            platform: 'Samsung Tizen TV'
        };
        this.sendAsync(this.ERROR_ENDPOINT, payload);
    },

    startHeartbeat(getCurrentTrack, getCurrentTime, getDuration, isPlayingFn) {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = setInterval(() => {
            try {
                if (isPlayingFn && isPlayingFn()) {
                    const track = getCurrentTrack();
                    if (track) {
                        this.trackProgress(track, getCurrentTime(), getDuration(), 'playing');
                    }
                }
            } catch (e) {}
        }, 15000);
    }
};

if (typeof window !== 'undefined') {
    window.AyushMuzicTelemetry = AyushMuzicTelemetry;
    window.addEventListener('error', function(event) {
        AyushMuzicTelemetry.reportError(event.error || event.message, event.filename || 'window');
    });
}
