/**
 * AyushMuzic Tizen Smart TV — Standalone API Bridge
 * Intercepts /api/* requests so the entire app runs standalone on Tizen TV
 * with NO external server needed. Direct iTunes + YouTube + LRCLIB integration.
 */

(function() {
    'use strict';

    // Curated High-Definition Hits across moods
    const CURATED_HITS = [
        {
            videoId: 'kJQP7kiw5Fk',
            title: 'Despacito',
            artists: ['Luis Fonsi', 'Daddy Yankee'],
            album: 'Vida',
            duration: 228,
            durationText: '3:48',
            thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
            mood: 'Party'
        },
        {
            videoId: 'JGwWNGJdvx8',
            title: 'Shape of You',
            artists: ['Ed Sheeran'],
            album: '÷ (Divide)',
            duration: 233,
            durationText: '3:53',
            thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
            mood: 'Energize'
        },
        {
            videoId: 'OPf0YbXqDm0',
            title: 'Uptown Funk',
            artists: ['Mark Ronson', 'Bruno Mars'],
            album: 'Uptown Special',
            duration: 270,
            durationText: '4:30',
            thumbnail: 'https://i.ytimg.com/vi/OPf0YbXqDm0/hqdefault.jpg',
            mood: 'Party'
        },
        {
            videoId: 'DyHmNVKHoG8',
            title: 'Blinding Lights',
            artists: ['The Weeknd'],
            album: 'After Hours',
            duration: 200,
            durationText: '3:20',
            thumbnail: 'https://i.ytimg.com/vi/DyHmNVKHoG8/hqdefault.jpg',
            mood: 'Workout'
        },
        {
            videoId: 'uelHwf8o7_U',
            title: 'Levitating',
            artists: ['Dua Lipa'],
            album: 'Future Nostalgia',
            duration: 203,
            durationText: '3:23',
            thumbnail: 'https://i.ytimg.com/vi/uelHwf8o7_U/hqdefault.jpg',
            mood: 'Energize'
        },
        {
            videoId: 'DyDfgMOUjCI',
            title: 'Believer',
            artists: ['Imagine Dragons'],
            album: 'Evolve',
            duration: 204,
            durationText: '3:24',
            thumbnail: 'https://i.ytimg.com/vi/DyDfgMOUjCI/hqdefault.jpg',
            mood: 'Workout'
        },
        {
            videoId: 'hT_nvWreIhg',
            title: 'Counting Stars',
            artists: ['OneRepublic'],
            album: 'Native',
            duration: 257,
            durationText: '4:17',
            thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
            mood: 'Focus'
        },
        {
            videoId: '09R8_2nJtjg',
            title: 'Sugar',
            artists: ['Maroon 5'],
            album: 'V',
            duration: 235,
            durationText: '3:55',
            thumbnail: 'https://i.ytimg.com/vi/09R8_2nJtjg/hqdefault.jpg',
            mood: 'Feel Good'
        },
        {
            videoId: 'wyzBOrkxkFw',
            title: 'Perfect',
            artists: ['Ed Sheeran'],
            album: '÷ (Divide)',
            duration: 263,
            durationText: '4:23',
            thumbnail: 'https://i.ytimg.com/vi/wyzBOrkxkFw/hqdefault.jpg',
            mood: 'Romance'
        },
        {
            videoId: 'Y8OfShKjA-I',
            title: 'All of Me',
            artists: ['John Legend'],
            album: 'Love in the Future',
            duration: 269,
            durationText: '4:29',
            thumbnail: 'https://i.ytimg.com/vi/Y8OfShKjA-I/hqdefault.jpg',
            mood: 'Romance'
        },
        {
            videoId: 'fJ9rUzIMcZQ',
            title: 'Bohemian Rhapsody',
            artists: ['Queen'],
            album: 'A Night at the Opera',
            duration: 359,
            durationText: '5:59',
            thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
            mood: 'Focus'
        },
        {
            videoId: 'YQHsXMglC9A',
            title: 'Hello',
            artists: ['Adele'],
            album: '25',
            duration: 295,
            durationText: '4:55',
            thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/hqdefault.jpg',
            mood: 'Sad'
        },
        {
            videoId: 'SlPhMPnQ58k',
            title: 'Memories',
            artists: ['Maroon 5'],
            album: 'JORDI',
            duration: 189,
            durationText: '3:09',
            thumbnail: 'https://i.ytimg.com/vi/SlPhMPnQ58k/hqdefault.jpg',
            mood: 'Relax'
        },
        {
            videoId: 'k2qgadSvNyU',
            title: 'New Rules',
            artists: ['Dua Lipa'],
            album: 'Dua Lipa',
            duration: 209,
            durationText: '3:29',
            thumbnail: 'https://i.ytimg.com/vi/k2qgadSvNyU/hqdefault.jpg',
            mood: 'Party'
        },
        {
            videoId: 'AXeB1vrz7II',
            title: 'Sharmeeli',
            artists: ['Frappe Ash', 'Yungsta'],
            album: 'Sharmeeli',
            duration: 215,
            durationText: '3:35',
            thumbnail: 'https://i.ytimg.com/vi/AXeB1vrz7II/hqdefault.jpg',
            mood: 'Energize'
        },
        {
            videoId: 'nfWlot6h_JM',
            title: 'Shake It Off',
            artists: ['Taylor Swift'],
            album: '1989',
            duration: 219,
            durationText: '3:39',
            thumbnail: 'https://i.ytimg.com/vi/nfWlot6h_JM/hqdefault.jpg',
            mood: 'Party'
        },
        {
            videoId: 'gdZLi9oWNZg',
            title: 'Cheap Thrills',
            artists: ['Sia', 'Sean Paul'],
            album: 'This Is Acting',
            duration: 224,
            durationText: '3:44',
            thumbnail: 'https://i.ytimg.com/vi/gdZLi9oWNZg/hqdefault.jpg',
            mood: 'Party'
        },
        {
            videoId: 'OgcnOqtAeF0',
            title: 'Havana',
            artists: ['Camila Cabello', 'Young Thug'],
            album: 'Camila',
            duration: 217,
            durationText: '3:37',
            thumbnail: 'https://i.ytimg.com/vi/OgcnOqtAeF0/hqdefault.jpg',
            mood: 'Feel Good'
        },
        {
            videoId: 'lYBUbBu4W08',
            title: 'Thunder',
            artists: ['Imagine Dragons'],
            album: 'Evolve',
            duration: 187,
            durationText: '3:07',
            thumbnail: 'https://i.ytimg.com/vi/lYBUbBu4W08/hqdefault.jpg',
            mood: 'Workout'
        },
        {
            videoId: 'GaoLU6zKaws',
            title: 'Stressed Out',
            artists: ['Twenty One Pilots'],
            album: 'Blurryface',
            duration: 202,
            durationText: '3:22',
            thumbnail: 'https://i.ytimg.com/vi/GaoLU6zKaws/hqdefault.jpg',
            mood: 'Relax'
        }
    ];

    // Helper: format duration in seconds to mm:ss
    function fmtDuration(sec) {
        if (!sec || isNaN(sec)) return '3:30';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Intercept window.fetch
    const realFetch = window.fetch.bind(window);

    window.fetch = async function(input, init) {
        let url = typeof input === 'string' ? input : (input && input.url ? input.url : '');

        // Pass-through non-/api calls
        if (!url.startsWith('/api/') && !url.includes('/api/')) {
            return realFetch(input, init);
        }

        console.log('[API Bridge] Intercepted:', url);
        const parsed = new URL(url, window.location.href);
        const pathname = parsed.pathname;
        const params = parsed.searchParams;

        // 1. HOME FEED (/api/home)
        if (pathname === '/api/home') {
            const mood = params.get('mood') || '';
            let items = CURATED_HITS;
            if (mood && mood !== 'Trending') {
                items = CURATED_HITS.filter(h => (h.mood || '').toLowerCase() === mood.toLowerCase());
                if (!items.length) items = CURATED_HITS;
            }

            const responseData = {
                sections: [
                    {
                        title: mood ? `${mood} Hits` : 'Quick Picks',
                        items: items
                    }
                ]
            };
            return new Response(JSON.stringify(responseData), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. SEARCH (/api/search)
        if (pathname === '/api/search') {
            const q = params.get('q') || '';
            const type = params.get('type') || 'song';

            if (!q.trim()) {
                return new Response(JSON.stringify({ songs: [], artists: [], albums: [], playlists: [] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            try {
                // Search via iTunes API (fast, open CORS, high quality metadata & artwork)
                const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=25`;
                const itunesRes = await realFetch(itunesUrl);
                const itunesData = await itunesRes.json();

                const songs = (itunesData.results || []).map(r => {
                    const thumb = (r.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg');
                    const durSec = Math.round((r.trackTimeMillis || 210000) / 1000);
                    const title = r.trackName || 'Unknown Title';
                    const artist = r.artistName || 'Unknown Artist';
                    // Video ID encoded as query for YouTube Player
                    const videoId = `yt_${encodeURIComponent(title + ' ' + artist)}`;

                    return {
                        videoId: videoId,
                        title: title,
                        artists: [artist],
                        artist: artist,
                        album: r.collectionName || '',
                        duration: durSec,
                        durationText: fmtDuration(durSec),
                        thumbnail: thumb || 'assets/logo.png'
                    };
                });

                // Also match any local hits
                const localMatches = CURATED_HITS.filter(h =>
                    h.title.toLowerCase().includes(q.toLowerCase()) ||
                    h.artists.some(a => a.toLowerCase().includes(q.toLowerCase()))
                );

                const finalSongs = [...localMatches, ...songs];

                return new Response(JSON.stringify({
                    songs: finalSongs,
                    artists: [],
                    albums: [],
                    playlists: []
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                console.error('[API Bridge] Search failed:', err);
                // Fallback to local hits filter
                const matches = CURATED_HITS.filter(h =>
                    h.title.toLowerCase().includes(q.toLowerCase()) ||
                    h.artists.some(a => a.toLowerCase().includes(q.toLowerCase()))
                );
                return new Response(JSON.stringify({ songs: matches, artists: [], albums: [], playlists: [] }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        // 3. RELATED SONGS (/api/related)
        if (pathname === '/api/related') {
            const query = params.get('query') || '';
            const related = [...CURATED_HITS].sort(() => 0.5 - Math.random()).slice(0, 10);
            return new Response(JSON.stringify({ songs: related }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 4. LYRICS (/api/lyrics)
        if (pathname === '/api/lyrics') {
            const title = params.get('title') || '';
            const artist = params.get('artist') || '';

            try {
                const cleanT = title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
                const cleanA = artist.split(/[,&]/)[0].trim();
                const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanT)}&artist_name=${encodeURIComponent(cleanA)}`;
                const lRes = await realFetch(lrclibUrl);

                if (lRes.ok) {
                    const lData = await lRes.json();
                    if (lData.syncedLyrics) {
                        const lines = [];
                        const raw = lData.syncedLyrics.split('\n');
                        for (const line of raw) {
                            const m = line.match(/\[(\d+):(\d+\.?\d*)\](.*)/);
                            if (m) {
                                const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
                                const text = m[3].trim();
                                lines.push({ time, text });
                            }
                        }
                        return new Response(JSON.stringify({ synced: true, lines: lines }), {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                }
            } catch (e) {
                console.warn('[API Bridge] Lyrics fetch error:', e);
            }

            // Fallback
            return new Response(JSON.stringify({
                synced: false,
                lines: [
                    { time: 0, text: `♪ ${title} ♪` },
                    { time: 4, text: `Artist: ${artist}` },
                    { time: 8, text: 'Ad-free high-fidelity audio stream' }
                ]
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 5. STREAM PROXY (/api/stream)
        if (pathname === '/api/stream') {
            const videoId = params.get('videoId') || '';
            // Trigger playback on global player
            if (window.YTStreamPlayer) {
                window.YTStreamPlayer.play(videoId);
            }
            // Return dummy 200 audio response
            return new Response(new Uint8Array(0), {
                status: 200,
                headers: { 'Content-Type': 'audio/mpeg' }
            });
        }

        return realFetch(input, init);
    };

    console.log('✓ AyushMuzic Standalone API Bridge Active');
})();
