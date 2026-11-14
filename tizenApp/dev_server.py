import http.server, socketserver, urllib.parse, urllib.request, re, json, os

PORT = 8080
DIRECTORY = r'C:\Users\AYUSH\Downloads\SimpMusic-dev\SimpMusic-dev\tizenApp'

class AyushMuzicServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/yt_id':
            params = urllib.parse.parse_qs(parsed.query)
            q = params.get('q', [''])[0]
            vid = ''
            if q:
                try:
                    url = 'https://www.youtube.com/results?search_query=' + urllib.parse.quote(q)
                    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                    with urllib.request.urlopen(req, timeout=4) as resp:
                        html = resp.read().decode('utf-8', errors='ignore')
                        vids = list(dict.fromkeys(re.findall(r'videoId\":\"([a-zA-Z0-9_-]{11})', html)))
                        if vids:
                            vid = vids[0]
                except Exception as e:
                    print('Search YT err:', e)

            res = json.dumps({'videoId': vid, 'query': q}).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(res)
            return

        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), AyushMuzicServer) as httpd:
        print(f'AyushMuzic Dev Server running on http://localhost:{PORT}')
        httpd.serve_forever()
