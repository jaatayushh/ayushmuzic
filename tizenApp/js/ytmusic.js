// YouTube Music & Stream Resolver Service for Tizen Smart TV
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