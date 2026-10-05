const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.xml': 'application/xml; charset=utf-8',
    '.wgt': 'application/x-tizen-wgt'
};

// Caches
const streamCache = new Map();
const radioCache = new Map();
const lyricsCache = new Map();
const CACHE_TTL = 3600 * 1000; // 1 hour

// YouTube Auth Session
let userSession = {
    loggedIn: false,
    cookie: '',
    name: 'Guest',
    avatar: 'icon.png'
};

// Helper: Make YouTube Music Innertube Request
function callInnertube(endpoint, postData, customCookie, callback) {
    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://music.youtube.com/',
        'Content-Length': Buffer.byteLength(postData)
    };
    if (customCookie || userSession.cookie) {
        headers['Cookie'] = customCookie || userSession.cookie;
    }

    const req = https.request(`https://music.youtube.com/youtubei/v1/${endpoint}`, {
        method: 'POST',
        headers: headers
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                callback(null, json);
            } catch (err) {
                callback(err, null);
            }
        });
    });

    req.on('error', (err) => callback(err, null));
    req.write(postData);
    req.end();
}

// 1. Search YouTube Music Songs
function searchYouTubeMusic(query, callback) {
    if (!query || !query.trim()) return callback(null, []);

    const postData = JSON.stringify({
        context: {
            client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.01.00', hl: 'en', gl: 'US' }
        },
        query: query.trim(),
        params: 'EgWKAQIIAWoKEAkQChAFEAMQCQ%3D%3D' // Strictly Songs
    });

    callInnertube('search', postData, null, (err, json) => {
        if (err || !json) return callback(err, []);
        try {
            const tabs = json.contents?.tabbedSearchResultsRenderer?.tabs || [];
            const sectionList = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
            const tracks = [];
            const seenIds = new Set();

            function parseItem(r) {
                if (!r) return;
                const videoId = r.playlistItemData?.videoId ||
                    r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
                    r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;

                if (!videoId || seenIds.has(videoId)) return;
                seenIds.add(videoId);

                const title = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text || 'Unknown Title';
                const subtitleRuns = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                let artist = 'Unknown Artist';
                let album = '';
                let durationStr = '3:30';

                if (subtitleRuns.length > 0) {
                    const parts = [];
                    let cur = '';
                    subtitleRuns.forEach(run => {
                        if (run.text === ' • ') {
                            if (cur.trim()) parts.push(cur.trim());
                            cur = '';
                        } else {
                            cur += run.text;
                        }
                    });
                    if (cur.trim()) parts.push(cur.trim());

                    if (parts.length >= 1) artist = parts[0];
                    if (parts.length >= 2) {
                        if (parts.length === 2 && /^\d+:\d+$/.test(parts[1])) {
                            durationStr = parts[1];
                        } else {
                            album = parts[1];
                            if (parts.length >= 3 && /^\d+:\d+$/.test(parts[2])) {
                                durationStr = parts[2];
                            }
                        }
                    }
                }

                let thumb = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                thumb = thumb.replace(/=w\d+-h\d+/, '=w544-h544');

                let durationSec = 210;
                const timeParts = durationStr.split(':');
                if (timeParts.length === 2) durationSec = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

                tracks.push({ id: videoId, title, artist, album, duration: durationStr, durationSec, thumb });
            }

            for (const sec of sectionList) {
                if (sec.musicShelfRenderer?.contents) {
                    sec.musicShelfRenderer.contents.forEach(it => parseItem(it.musicResponsiveListItemRenderer));
                }
            }

            callback(null, tracks);
        } catch (e) {
            callback(e, []);
        }
    });
}

// 2. YouTube Music Algorithmic Radio Queue (RDAMVM)
function getRadioQueue(videoId, callback) {
    if (!videoId) return callback(new Error('Missing videoId'), []);

    const cached = radioCache.get(videoId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return callback(null, cached.tracks);
    }

    const postData = JSON.stringify({
        context: {
            client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.01.00', hl: 'en', gl: 'US' }
        },
        videoId: videoId,
        playlistId: 'RDAMVM' + videoId,
        isAudioOnly: true
    });

    callInnertube('next', postData, null, (err, json) => {
        if (err || !json) return callback(err, []);
        try {
            const tab = json.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer;
            const items = tab?.content?.playlistPanelRenderer?.contents || [];
            const tracks = [];
            const seenIds = new Set();

            items.forEach(it => {
                const r = it.playlistPanelVideoRenderer;
                if (!r || !r.videoId || seenIds.has(r.videoId)) return;
                seenIds.add(r.videoId);

                const title = r.title?.runs?.[0]?.text || 'Unknown Title';
                const artist = r.shortBylineText?.runs?.[0]?.text || 'Unknown Artist';
                const durationStr = r.lengthText?.runs?.[0]?.text || '3:30';

                let thumb = r.thumbnail?.thumbnails?.slice(-1)[0]?.url || `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`;
                thumb = thumb.replace(/=w\d+-h\d+/, '=w544-h544');

                let durationSec = 210;
                const timeParts = durationStr.split(':');
                if (timeParts.length === 2) durationSec = parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);

                tracks.push({
                    id: r.videoId,
                    title,
                    artist,
                    album: '',
                    duration: durationStr,
                    durationSec,
                    thumb
                });
            });

            console.log(`[RadioQueue] Fetched ${tracks.length} recommended tracks for video ${videoId}`);
            radioCache.set(videoId, { tracks, timestamp: Date.now() });
            callback(null, tracks);
        } catch (e) {
            callback(e, []);
        }
    });
}

// 3. Time-Synced Lyrics Engine (LRCLIB & YouTube Music)
function getLyrics(title, artist, videoId, callback) {
    const cacheKey = `${title}_${artist}`.toLowerCase();
    const cached = lyricsCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return callback(null, cached.lyrics);
    }

    // Query LRCLIB for Time-Synced Lyrics
    const cleanTitle = (title || '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
    const cleanArtist = (artist || '').split(/[,&]/)[0].trim();
    const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;

    https.get(lrclibUrl, { headers: { 'User-Agent': 'AyushMuzic/1.0 (SmartTV; TizenOS)' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                try {
                    const json = JSON.parse(data);
                    const synced = json.syncedLyrics;
                    if (synced) {
                        const parsedLines = [];
                        const rawLines = synced.split('\n');
                        for (const line of rawLines) {
                            const match = line.match(/\[(\d+):(\d+\.?\d*)\](.*)/);
                            if (match) {
                                const min = parseInt(match[1], 10);
                                const sec = parseFloat(match[2]);
                                const time = min * 60 + sec;
                                const text = match[3].trim();
                                parsedLines.push({ time, text });
                            }
                        }
                        const result = { synced: true, lines: parsedLines, raw: synced };
                        lyricsCache.set(cacheKey, { lyrics: result, timestamp: Date.now() });
                        return callback(null, result);
                    }
                    if (json.plainLyrics) {
                        const plainLines = json.plainLyrics.split('\n').map((text, i) => ({ time: i * 4, text: text.trim() }));
                        const result = { synced: false, lines: plainLines, raw: json.plainLyrics };
                        lyricsCache.set(cacheKey, { lyrics: result, timestamp: Date.now() });
                        return callback(null, result);
                    }
                } catch (e) {}
            }

            // Fallback: Default placeholder lyrics
            const fallback = {
                synced: false,
                lines: [
                    { time: 0, text: `♪ ${cleanTitle} ♪` },
                    { time: 5, text: `Artist: ${cleanArtist}` },
                    { time: 10, text: "Lyrics unavailable for this track." },
                    { time: 15, text: "Enjoy the high-fidelity ad-free audio!" }
                ],
                raw: "Lyrics unavailable for this track."
            };
            callback(null, fallback);
        });
    }).on('error', () => {
        callback(null, { synced: false, lines: [], raw: '' });
    });
}

// 4. Audio Stream Resolver (yt-dlp) with Range Header Support
function resolveAudioStreamUrl(videoId, callback) {
    const cached = streamCache.get(videoId);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return callback(null, cached.url);
    }

    const py = spawn('python', [
        '-m', 'yt_dlp',
        '-g',
        '-f', 'bestaudio/best',
        '--no-warnings',
        '--no-playlist',
        `https://www.youtube.com/watch?v=${videoId}`
    ]);

    let stdout = '';
    let stderr = '';
    py.stdout.on('data', d => stdout += d);
    py.stderr.on('data', d => stderr += d);

    py.on('close', code => {
        if (code === 0) {
            const lines = stdout.trim().split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
            if (lines.length > 0) {
                const streamUrl = lines[0];
                streamCache.set(videoId, { url: streamUrl, timestamp: Date.now() });
                return callback(null, streamUrl);
            }
        }
        callback(new Error('Stream extraction failed'));
    });
}

function handleStreamProxy(req, res, videoId) {
    resolveAudioStreamUrl(videoId, (err, streamUrl) => {
        if (err || !streamUrl) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Stream extraction failed' }));
        }

        const clientRange = req.headers.range || 'bytes=0-';
        const parsed = new URL(streamUrl);

        const options = {
            hostname: parsed.hostname,
            port: 443,
            path: parsed.pathname + parsed.search,
            method: 'GET',
            headers: {
                'Range': clientRange,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity'
            }
        };

        const proxyReq = https.request(options, (remoteRes) => {
            const responseHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': '*',
                'Accept-Ranges': 'bytes',
                'Content-Type': remoteRes.headers['content-type'] || 'audio/webm',
                'Cache-Control': 'no-cache'
            };

            if (remoteRes.headers['content-range']) responseHeaders['Content-Range'] = remoteRes.headers['content-range'];
            if (remoteRes.headers['content-length']) responseHeaders['Content-Length'] = remoteRes.headers['content-length'];

            res.writeHead(remoteRes.statusCode || 206, responseHeaders);
            remoteRes.pipe(res);
        });

        proxyReq.on('error', () => {
            if (!res.headersSent) {
                res.writeHead(502, { 'Content-Type': 'text/plain' });
                res.end('Proxy streaming error');
            }
        });

        req.on('close', () => proxyReq.destroy());
        proxyReq.end();
    });
}

// 5. Server Request Dispatcher
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // API: Search
    if (pathname === '/api/search') {
        const query = parsedUrl.query.q || '';
        searchYouTubeMusic(query, (err, tracks) => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ results: tracks }));
        });
        return;
    }

    // API: Algorithmic Radio Queue
    if (pathname === '/api/radio') {
        const videoId = parsedUrl.query.id || '';
        getRadioQueue(videoId, (err, tracks) => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ results: tracks }));
        });
        return;
    }

    // API: Lyrics
    if (pathname === '/api/lyrics') {
        const title = parsedUrl.query.title || '';
        const artist = parsedUrl.query.artist || '';
        const videoId = parsedUrl.query.id || '';
        getLyrics(title, artist, videoId, (err, lyrics) => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify(lyrics));
        });
        return;
    }

    // API: Trending
    if (pathname === '/api/trending') {
        searchYouTubeMusic('Top Hits Global 2026', (err, tracks) => {
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ results: tracks.length > 0 ? tracks : [] }));
        });
        return;
    }

    // API: Stream Proxy (Ad-free)
    if (pathname === '/api/stream') {
        const videoId = parsedUrl.query.id || '';
        if (!videoId) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            return res.end('Missing id parameter');
        }
        handleStreamProxy(req, res, videoId);
        return;
    }

    // API: Auth Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                const cookie = parsed.cookie || '';
                if (!cookie.trim()) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, error: 'Empty cookie' }));
                }

                userSession.loggedIn = true;
                userSession.cookie = cookie.trim();
                userSession.name = 'Ayush';
                userSession.avatar = 'https://lh3.googleusercontent.com/a/default-user=s120-c';

                console.log('[Auth] User successfully logged in with session cookie');
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: userSession }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: Auth Status
    if (pathname === '/api/auth/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(userSession));
        return;
    }

    // API: Auth Logout
    if (pathname === '/api/auth/logout' && req.method === 'POST') {
        userSession = { loggedIn: false, cookie: '', name: 'Guest', avatar: 'icon.png' };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
        return;
    }

    // Static Files
    let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
    fs.stat(filePath, (err, stat) => {
        if (err || !stat.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`[AyushMuzic] Server running on http://localhost:${PORT}`);
    console.log(`[AyushMuzic] Network access on http://192.168.31.28:${PORT}`);
    console.log(`[AyushMuzic] YouTube Radio & Synced Lyrics Engine: Online`);
});
