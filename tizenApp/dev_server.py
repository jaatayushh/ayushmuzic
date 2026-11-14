import http.server, socketserver, urllib.parse, urllib.request, json, os, time, sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

# Cache streams so repeat clicks are instant
STREAM_CACHE = {}

try:
    import yt_dlp
    HAS_YTDLP = True
except ImportError:
    HAS_YTDLP = False
    print("WARNING: yt_dlp not found!")

class AyushMuzicServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Range')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # 1. Search API (/api/search?q=query)
        if parsed.path == '/api/search':
            q = params.get('q', [''])[0].strip()
            results = []
            if q and HAS_YTDLP:
                try:
                    ydl_opts = {
                        'quiet': True,
                        'extract_flat': 'in_playlist',
                        'skip_download': True,
                    }
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        data = ydl.extract_info(f'ytsearch12:{q}', download=False)
                        for e in data.get('entries', []):
                            if not e: continue
                            vid = e.get('id')
                            if not vid: continue
                            results.append({
                                'id': vid,
                                'title': e.get('title', 'Unknown Title'),
                                'artist': e.get('uploader') or e.get('channel') or 'AyushMuzic Artist',
                                'duration': e.get('duration') or 210,
                                'cover': f'https://i.ytimg.com/vi/{vid}/hqdefault.jpg'
                            })
                except Exception as ex:
                    print(f"Search error for {q}: {ex}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'results': results, 'query': q}).encode('utf-8'))
            return

        # 2. Stream Resolution API (/api/stream?id=vid or /api/stream?q=query)
        if parsed.path == '/api/stream':
            vid = params.get('id', [''])[0].strip()
            q = params.get('q', [''])[0].strip()
            
            # Check cache first
            cache_key = vid or q
            if cache_key in STREAM_CACHE and (time.time() - STREAM_CACHE[cache_key]['time']) < 14400:
                res_data = STREAM_CACHE[cache_key]['data']
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(res_data).encode('utf-8'))
                return

            stream_info = None
            if HAS_YTDLP:
                target = f"https://www.youtube.com/watch?v={vid}" if vid else f"ytsearch1:{q}"
                try:
                    ydl_opts = {
                        'format': 'bestaudio[ext=m4a]/bestaudio/best',
                        'quiet': True,
                        'noplaylist': True,
                        'skip_download': True,
                    }
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        info = ydl.extract_info(target, download=False)
                        entry = info['entries'][0] if 'entries' in info else info
                        extracted_id = entry.get('id', vid)
                        direct_url = entry.get('url')
                        
                        stream_info = {
                            'id': extracted_id,
                            'title': entry.get('title'),
                            'artist': entry.get('uploader') or entry.get('channel') or 'AyushMuzic',
                            'duration': entry.get('duration') or 240,
                            'cover': entry.get('thumbnail') or f'https://i.ytimg.com/vi/{extracted_id}/hqdefault.jpg',
                            'streamUrl': direct_url,
                            'proxyUrl': f'/api/proxy_audio?url={urllib.parse.quote(direct_url)}' if direct_url else None
                        }
                        STREAM_CACHE[cache_key] = {'time': time.time(), 'data': stream_info}
                        if extracted_id:
                            STREAM_CACHE[extracted_id] = STREAM_CACHE[cache_key]
                except Exception as ex:
                    print(f"Stream extraction error for {target}: {ex}")

            self.send_response(200 if stream_info else 404)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(stream_info or {'error': 'Stream not found'}).encode('utf-8'))
            return

        # 3. Audio Streaming Proxy with Range Support (/api/proxy_audio?url=...)
        if parsed.path == '/api/proxy_audio':
            target_url = params.get('url', [''])[0]
            if not target_url:
                self.send_error(400, "Missing url parameter")
                return

            req_headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            if 'Range' in self.headers:
                req_headers['Range'] = self.headers['Range']

            try:
                upstream_req = urllib.request.Request(target_url, headers=req_headers)
                with urllib.request.urlopen(upstream_req, timeout=10) as up_resp:
                    self.send_response(up_resp.status)
                    for h in ['Content-Type', 'Content-Range', 'Content-Length', 'Accept-Ranges']:
                        val = up_resp.headers.get(h)
                        if val:
                            self.send_header(h, val)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()

                    # Stream data in chunks
                    while True:
                        chunk = up_resp.read(65536)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                return
            except Exception as ex:
                print(f"Proxy error: {ex}")
                self.send_error(502, f"Proxy failed: {ex}")
                return

        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    print(f"Starting AyushMuzic Dev Server on port {PORT}...")
    with socketserver.TCPServer(('', PORT), AyushMuzicServer) as httpd:
        print(f"AyushMuzic Dev Server LIVE on http://localhost:{PORT}")
        httpd.serve_forever()
