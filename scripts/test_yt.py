import urllib.request, json
req = urllib.request.Request(
    'https://music.youtube.com/youtubei/v1/browse?prettyPrint=false',
    data=json.dumps({
        'context': {
            'client': {
                'clientName': 'WEB_REMIX',
                'clientVersion': '1.20241028.01.00',
                'hl': 'en',
                'gl': 'IN'
            }
        },
        'browseId': 'FEmusic_home'
    }).encode(),
    headers={'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())

tabs = data.get('contents', {}).get('singleColumnBrowseResultsRenderer', {}).get('tabs', [])
sections = tabs[0].get('tabRenderer', {}).get('content', {}).get('sectionListRenderer', {}).get('contents', [])
print(f'Logged out home sections count: {len(sections)}')
for i, s in enumerate(sections[:10]):
    shelf = s.get('musicCarouselShelfRenderer', {})
    header = shelf.get('header', {}).get('musicCarouselShelfBasicHeaderRenderer', {})
    title = header.get('title', {}).get('runs', [{}])[0].get('text', 'NO_TITLE')
    strapline = header.get('strapline', {}).get('runs', [{}])[0].get('text', '')
    num_items = shelf.get('numItemsPerColumn', 'NONE')
    items = shelf.get('contents', [])
    first_item_type = list(items[0].keys())[0] if items else 'EMPTY'
    print(f'[{i}] Title: "{title}" | Strapline: "{strapline}" | numItemsPerColumn: {num_items} | firstItem: {first_item_type} ({len(items)} items)')
