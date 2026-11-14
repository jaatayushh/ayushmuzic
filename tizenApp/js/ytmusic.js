// =====================================================
// AyushMuzic Tizen TV — YouTube Music Service v2.0
// Full search, trending, home feed, stream extraction
// Uses Invidious API with smart instance rotation
// =====================================================

const YTMusicService = {
    // Rotating Invidious instances for reliability
    instances: [
        'https://inv.nadeko.net',
        'https://invidious.nerdvpn.de',
        'https://invidious.projectsegfau.lt',
        'https://yt.drgnz.club',
        'https://invidious.privacydev.net',
        'https://iv.datura.network',
        'https://invidious.incogniweb.net'
    ],
    _idx: 0,
    _failedInstances: new Set(),

    get baseUrl() {
        return this.instances[this._idx];
    },

    rotate() {
        this._failedInstances.add(this.instances[this._idx]);
        const available = this.instances.filter(i => !this._failedInstances.has(i));
        if (available.length === 0) {
            this._failedInstances.clear();
        }
        this._idx = (this._idx + 1) % this.instances.length;
        console.log('[YTMusic] Rotated to:', this.baseUrl);
    },

    async _get(path, timeout = 7000) {
        const tryInstances = [...this.instances.filter(i => !this._failedInstances.has(i)), ...this.instances];
        for (let i = 0; i < Math.min(tryInstances.length, 4); i++) {
            const base = tryInstances[i] || this.baseUrl;
            try {
                const resp = await fetch(base + path, {
                    signal: AbortSignal.timeout(timeout),
                    headers: { 'Accept': 'application/json' }
                });
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                return await resp.json();
            } catch (e) {
                console.warn('[YTMusic] Failed:', base + path, e.message);
                this._failedInstances.add(base);
                if (this._failedInstances.size >= this.instances.length) this._failedInstances.clear();
            }
        }
        return null;
    },

    _thumb(id, q = 'hqdefault') {
        return `https://i.ytimg.com/vi/${id}/${q}.jpg`;
    },

    // ---- Home Feed (curated playlists / trending mix) ----
    async getHomeFeed() {
        // Try trending as home feed base
        const trending = await this.getTrending(24);
        if (trending.length > 0) return trending;
        return this.getDefaultHits();
    },

    // ---- Search ----
    async search(query) {
        if (!query || !query.trim()) return [];
        const encoded = encodeURIComponent(query.trim());
        const data = await this._get(`/api/v1/search?q=${encoded}&type=video&fields=videoId,title,author,videoThumbnails,lengthSeconds`);
        if (!data || !Array.isArray(data)) return [];
        return data.slice(0, 30).map(item => ({
            id: item.videoId,
            title: item.title || 'Unknown',
            artist: item.author || 'Unknown Artist',
            duration: item.lengthSeconds || 0,
            thumb: item.videoThumbnails?.[4]?.url || item.videoThumbnails?.[0]?.url || this._thumb(item.videoId)
        })).filter(s => s.id && s.duration > 30);
    },

    // ---- Trending / Charts ----
    async getTrending(limit = 32) {
        const data = await this._get('/api/v1/trending?type=music&fields=videoId,title,author,videoThumbnails,viewCount,lengthSeconds');
        if (!data || !Array.isArray(data)) return this.getDefaultHits();
        return data.slice(0, limit).map(item => ({
            id: item.videoId,
            title: item.title || 'Unknown',
            artist: item.author || 'Unknown Artist',
            duration: item.lengthSeconds || 0,
            views: item.viewCount || 0,
            thumb: item.videoThumbnails?.[4]?.url || this._thumb(item.videoId)
        })).filter(s => s.id && s.duration > 30);
    },

    // ---- Stream URL extraction ----
    async getStreamUrl(videoId) {
        // 1) Try Invidious adaptiveFormats (pure audio, best quality)
        const data = await this._get(`/api/v1/videos/${videoId}?fields=adaptiveFormats,formatStreams`, 10000);
        if (data) {
            // m4a audio (itag 140) preferred for TV AVPlay compatibility
            const audioFormats = (data.adaptiveFormats || []).filter(f =>
                f.type && f.type.startsWith('audio/') && f.url
            );
            if (audioFormats.length > 0) {
                // Sort: prefer m4a (itag 140) then highest bitrate
                audioFormats.sort((a, b) => {
                    const isM4aA = a.container === 'm4a' || a.itag === 140;
                    const isM4aB = b.container === 'm4a' || b.itag === 140;
                    if (isM4aA && !isM4aB) return -1;
                    if (!isM4aA && isM4aB) return 1;
                    return (b.bitrate || 0) - (a.bitrate || 0);
                });
                console.log('[YTMusic] Audio stream:', audioFormats[0].itag, audioFormats[0].type);
                return audioFormats[0].url;
            }
            // Fallback to progressive
            if (data.formatStreams && data.formatStreams.length > 0) {
                return data.formatStreams[0].url;
            }
        }

        // 2) Invidious latest_version proxy (always works)
        const proxyUrl = `${this.baseUrl}/latest_version?id=${videoId}&itag=140`;
        console.log('[YTMusic] Using proxy stream:', proxyUrl);
        return proxyUrl;
    },

    // ---- Curated default hits (fallback when API offline) ----
    getDefaultHits() {
        return [
            { id: 'JGwWNGJdvx8', title: 'Shape of You', artist: 'Ed Sheeran', thumb: this._thumb('JGwWNGJdvx8') },
            { id: 'OPf0YbXqDm0', title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars', thumb: this._thumb('OPf0YbXqDm0') },
            { id: 'kJQP7kiw5Fk', title: 'Despacito', artist: 'Luis Fonsi ft. Daddy Yankee', thumb: this._thumb('kJQP7kiw5Fk') },
            { id: 'YQHsXMglC9A', title: 'Hello', artist: 'Adele', thumb: this._thumb('YQHsXMglC9A') },
            { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', artist: 'Queen', thumb: this._thumb('fJ9rUzIMcZQ') },
            { id: 'hT_nvWreIhg', title: 'Counting Stars', artist: 'OneRepublic', thumb: this._thumb('hT_nvWreIhg') },
            { id: '09R8_2nJtjg', title: 'Sugar', artist: 'Maroon 5', thumb: this._thumb('09R8_2nJtjg') },
            { id: 'CevxZvSJLk8', title: 'Roar', artist: 'Katy Perry', thumb: this._thumb('CevxZvSJLk8') },
            { id: 'k2qgadSvNyU', title: 'New Rules', artist: 'Dua Lipa', thumb: this._thumb('k2qgadSvNyU') },
            { id: 'nfWlot6h_JM', title: 'Shake It Off', artist: 'Taylor Swift', thumb: this._thumb('nfWlot6h_JM') },
            { id: 'SlPhMPnQ58k', title: 'Memories', artist: 'Maroon 5', thumb: this._thumb('SlPhMPnQ58k') },
            { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', artist: 'Rick Astley', thumb: this._thumb('dQw4w9WgXcQ') },
            { id: 'DyDfgMOUjCI', title: 'Believer', artist: 'Imagine Dragons', thumb: this._thumb('DyDfgMOUjCI') },
            { id: 'uelHwf8o7_U', title: 'Levitating', artist: 'Dua Lipa', thumb: this._thumb('uelHwf8o7_U') },
            { id: 'h_D3VFfhvs4', title: 'Thinking Out Loud', artist: 'Ed Sheeran', thumb: this._thumb('h_D3VFfhvs4') },
            { id: 'RgKAFK5djSk', title: 'See You Again', artist: 'Wiz Khalifa ft. Charlie Puth', thumb: this._thumb('RgKAFK5djSk') },
            { id: 'gdZLi9oWNZg', title: 'Cheap Thrills', artist: 'Sia', thumb: this._thumb('gdZLi9oWNZg') },
            { id: 'OgcnOqtAeF0', title: 'Havana', artist: 'Camila Cabello', thumb: this._thumb('OgcnOqtAeF0') },
            { id: 'lYBUbBu4W08', title: 'Thunder', artist: 'Imagine Dragons', thumb: this._thumb('lYBUbBu4W08') },
            { id: 'DyHmNVKHoG8', title: 'Blinding Lights', artist: 'The Weeknd', thumb: this._thumb('DyHmNVKHoG8') },
            { id: 'JRfuAukYTKg', title: 'Stay With Me', artist: 'Sam Smith', thumb: this._thumb('JRfuAukYTKg') },
            { id: 'wyzBOrkxkFw', title: 'Perfect', artist: 'Ed Sheeran', thumb: this._thumb('wyzBOrkxkFw') },
            { id: 'GaoLU6zKaws', title: 'Stressed Out', artist: 'Twenty One Pilots', thumb: this._thumb('GaoLU6zKaws') },
            { id: 'Y8OfShKjA-I', title: 'All of Me', artist: 'John Legend', thumb: this._thumb('Y8OfShKjA-I') },
        ];
    },

    // ---- Liked songs persistence ----
    getLiked() {
        try { return JSON.parse(localStorage.getItem('am_liked') || '[]'); } catch { return []; }
    },
    toggleLike(song) {
        let liked = this.getLiked();
        const idx = liked.findIndex(s => s.id === song.id);
        if (idx >= 0) { liked.splice(idx, 1); return false; }
        liked.unshift(song);
        if (liked.length > 200) liked = liked.slice(0, 200);
        localStorage.setItem('am_liked', JSON.stringify(liked));
        return true;
    },
    isLiked(id) {
        return this.getLiked().some(s => s.id === id);
    },

    // ---- Recent plays ----
    getRecent() {
        try { return JSON.parse(localStorage.getItem('am_recent') || '[]'); } catch { return []; }
    },
    addRecent(song) {
        let recent = this.getRecent().filter(s => s.id !== song.id);
        recent.unshift(song);
        if (recent.length > 50) recent = recent.slice(0, 50);
        localStorage.setItem('am_recent', JSON.stringify(recent));
    },

    formatTime(secs) {
        if (!secs || isNaN(secs)) return '0:00';
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }
};
