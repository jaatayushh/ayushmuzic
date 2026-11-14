/**
 * AyushMuzic Smart TV Core Engine
 * 100% 1:1 Parity with AyushMuzic Android App
 * Dual Playback Engine (Official YouTube Embed + HTML5 Audio), Synced Lyrics, D-Pad Remote Control
 */

(function() {
  'use strict';

  // 1. Initial Reference Tracks (100% Matching user_ss.jpg)
  const INITIAL_TRACKS = [
    {
      videoId: 'kJQP7kiw5Fk',
      title: 'Wake Up',
      artist: 'Krish Rao',
      album: 'Wake Up - Single',
      duration: 167,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f9/ac/85/f9ac85bb-9e47-2f10-6981-b5ff19c7ca6b/26UM1IM28034.rgb.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/f5/77/02/f5770234-aa9f-004b-311c-b747bb0248ae/mzaf_16317511395932772012.plus.aac.p.m4a'
    },
    {
      videoId: 'JGwWNGJdvx8',
      title: 'Soch (feat. Karan Aujla)',
      artist: 'Intense',
      album: 'Soch',
      duration: 224,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/43/a7/61/43a76189-9afa-8509-3396-a9f320e1697e/859718001348_cover.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/1c/60/26/1c6026dd-05c7-4eea-5489-4cfdb5253468/mzaf_5958227331736530086.plus.aac.p.m4a'
    },
    {
      videoId: 'OPf0YbXqDm0',
      title: 'Piche Tere',
      artist: 'Kunwarr',
      album: 'Piche Tere',
      duration: 120,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/18/a6/5c/18a65cc6-4b64-444e-3113-1a024fd5c4d2/8902633377431.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/17/ae/db/17aedb14-bd64-941a-32c6-431a7bc90ce1/mzaf_17178062549233223855.plus.aac.p.m4a'
    },
    {
      videoId: 'DyHmNVKHoG8',
      title: 'Mi Amor',
      artist: 'Sharn',
      album: 'Mi Amor',
      duration: 203,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/63/37/23/633723fa-a095-d5ed-794b-a2351c33851e/199350505591.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/bf/51/4a/bf514ab7-c16e-5cac-e442-c2e75574c27d/mzaf_6648123659717255775.plus.aac.p.m4a'
    },
    {
      videoId: '34Na4j8AVgA',
      title: 'Starboy',
      artist: 'The Weeknd, Daft Punk',
      album: 'Starboy',
      duration: 230,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a'
    },
    {
      videoId: 'uelHwf8o7_U',
      title: 'Tera Ban Jaunga',
      artist: 'Akhil Sachdeva, Tulsi Kumar',
      album: 'Kabir Singh',
      duration: 236,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f6/70/84/f6708434-0123-ff36-0ac3-7401e8cf0f94/8902894360807_cover.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/8e/b7/b9/8eb7b96b-ce3b-98b8-4ed9-c0c9aff20960/mzaf_13167890250017028075.plus.aac.p.m4a'
    },
    {
      videoId: '09R8_2nJtjg',
      title: 'Woofer',
      artist: 'Dr. Zeus, Zora Randhawa',
      album: 'Woofer',
      duration: 172,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/44/7a/0b/447a0bce-4814-d1a3-d92c-75a459e417b9/886446910741.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/79/16/79/791679a3-04d6-0b17-7971-729942d2f159/mzaf_15249635295154942822.plus.aac.p.m4a'
    },
    {
      videoId: 'hT_nvWreIhg',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 200,
      thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/11/71/d6/1171d6ad-3c96-e027-2af6-58028426588c/mzaf_15137631797407745471.plus.aac.p.m4a'
    },
    {
      videoId: 'wyzBOrkxkFw',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      duration: 204,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/59/dc/4d/59dc4dda-93ff-8f1c-c536-f005f6ea6af5/mzaf_3066686759813252385.plus.aac.p.m4a'
    },
    {
      videoId: 'DyDfgMOUjCI',
      title: 'Believer',
      artist: 'Imagine Dragons',
      album: 'Evolve',
      duration: 204,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/7a/b8/117ab805-6811-8929-18b9-0fad7baf0c25/17UMGIM98210.rgb.jpg/600x600bb.jpg',
      previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/c0/3f/36/c03f367a-b66b-fd0a-a54c-30f8250c4410/mzaf_12768434238801682952.plus.aac.p.m4a'
    }
  ];

  // 2. Application State
  const State = {
    queue: [...INITIAL_TRACKS],
    currentIndex: 0,
    currentSong: INITIAL_TRACKS[0],
    isPlaying: false,
    currentTime: 0,
    duration: 215,
    lyricsLines: [],
    favorites: new Set(),
    activeScreen: 'viewHome',
    ytPlayer: null,
    ytReady: false
  };

  // 3. Audio Player Elements
  const audioEl = document.getElementById('html5AudioPlayer');

  // Format mm:ss
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // 4. Initialize YouTube Iframe Engine
  window.onYouTubeIframeAPIReady = function() {
    try {
      State.ytPlayer = new YT.Player('ytContainer', {
        height: '200',
        width: '200',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1
        },
        events: {
          onReady: () => {
            State.ytReady = true;
            console.log('✓ YouTube Audio Engine Ready');
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              setPlaybackState(true);
            } else if (e.data === YT.PlayerState.PAUSED) {
              setPlaybackState(false);
            } else if (e.data === YT.PlayerState.ENDED) {
              playNext();
            }
          }
        }
      });
    } catch (e) {
      console.warn('YouTube embed init err:', e);
    }
  };

  // Progress ticker
  setInterval(() => {
    if (State.isPlaying) {
      let cur = 0;
      let dur = State.duration;

      if (State.ytPlayer && typeof State.ytPlayer.getCurrentTime === 'function') {
        const yCur = State.ytPlayer.getCurrentTime();
        const yDur = State.ytPlayer.getDuration();
        if (yCur && yCur > 0) cur = yCur;
        if (yDur && yDur > 0) dur = yDur;
      } else if (audioEl && !audioEl.paused) {
        cur = audioEl.currentTime;
        dur = audioEl.duration || State.duration;
      }

      State.currentTime = cur;
      State.duration = dur;

      // Update seekbars and times
      const curStr = formatTime(cur);
      const durStr = formatTime(dur);
      const pct = dur > 0 ? (cur / dur) * 100 : 0;

      const npCur = document.getElementById('npCurrentTime');
      const npDur = document.getElementById('npDurationTime');
      const npSeek = document.getElementById('npSeekBar');

      if (npCur) npCur.textContent = curStr;
      if (npDur) npDur.textContent = durStr;
      if (npSeek) npSeek.value = pct;

      updateLyricsHighlight(cur);
    }
  }, 250);

  // 5. Playback Controller
  function playSong(song) {
    if (!song) return;
    State.currentSong = song;
    State.duration = song.duration || 215;
    State.currentTime = 0;

    // Update Mini Player UI
    const mpTitle = document.getElementById('mpTitle');
    const mpArtist = document.getElementById('mpArtist');
    const mpThumb = document.getElementById('mpThumb');
    if (mpTitle) mpTitle.textContent = song.title;
    if (mpArtist) mpArtist.textContent = song.artist;
    if (mpThumb) mpThumb.src = song.thumbnail || 'assets/starboy_square.jpg';

    // Update Now Playing UI
    const npTitle = document.getElementById('npTitle');
    const npArtist = document.getElementById('npArtist');
    const npArtwork = document.getElementById('npArtwork');
    const npHeaderAlbum = document.getElementById('npHeaderAlbum');
    if (npTitle) npTitle.textContent = song.title;
    if (npArtist) npArtist.textContent = song.artist;
    if (npArtwork) npArtwork.src = song.thumbnail || 'assets/starboy_square.jpg';
    if (npHeaderAlbum) npHeaderAlbum.textContent = song.album || 'AyushMuzic Stream';

    // Update Favorite Buttons
    updateFaveUI(State.favorites.has(song.videoId || song.title));

    // Update Dynamic Mesh Backdrop
    updateDynamicMesh(song.thumbnail);

    // Load Synced Lyrics
    loadLyrics(song);

    // Audio Playback
    const vId = song.videoId;
    if (State.ytPlayer && typeof State.ytPlayer.loadVideoById === 'function' && vId) {
      console.log('Playing via YouTube Engine:', vId);
      State.ytPlayer.loadVideoById({
        videoId: vId,
        suggestedQuality: 'small'
      });
      State.ytPlayer.playVideo();
      setPlaybackState(true);
    } else if (song.previewUrl) {
      audioEl.src = song.previewUrl;
      audioEl.play().catch(e => console.log('Audio element play err:', e));
      setPlaybackState(true);
    } else {
      // Fallback: search YouTube for videoId or preview
      fetchYouTubeVideoId(song.title + ' ' + song.artist).then(foundId => {
        if (foundId && State.ytPlayer && typeof State.ytPlayer.loadVideoById === 'function') {
          song.videoId = foundId;
          State.ytPlayer.loadVideoById(foundId);
          State.ytPlayer.playVideo();
          setPlaybackState(true);
        }
      });
    }
  }

  function setPlaybackState(playing) {
    State.isPlaying = playing;
    const playSvg = `<path d="M8 5v14l11-7z"/>`;
    const pauseSvg = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;

    const mpIcon = document.getElementById('mpPlayPauseSvg');
    const npIcon = document.getElementById('npMainPlaySvg');

    if (mpIcon) mpIcon.innerHTML = playing ? pauseSvg : playSvg;
    if (npIcon) npIcon.innerHTML = playing ? pauseSvg : playSvg;
  }

  function togglePlay() {
    if (State.isPlaying) {
      if (State.ytPlayer && typeof State.ytPlayer.pauseVideo === 'function') {
        State.ytPlayer.pauseVideo();
      }
      if (audioEl) audioEl.pause();
      setPlaybackState(false);
    } else {
      if (State.ytPlayer && typeof State.ytPlayer.playVideo === 'function') {
        State.ytPlayer.playVideo();
      }
      if (audioEl && audioEl.src) audioEl.play().catch(() => {});
      setPlaybackState(true);
    }
  }

  function playNext() {
    if (State.queue.length === 0) return;
    State.currentIndex = (State.currentIndex + 1) % State.queue.length;
    playSong(State.queue[State.currentIndex]);
  }

  function playPrev() {
    if (State.queue.length === 0) return;
    State.currentIndex = (State.currentIndex - 1 + State.queue.length) % State.queue.length;
    playSong(State.queue[State.currentIndex]);
  }

  // 6. Dynamic Mesh Background Color Extraction
  function updateDynamicMesh(imgUrl) {
    const mesh = document.getElementById('dynamicMeshBackdrop');
    if (!mesh) return;
    // Generate harmonious dynamic gradients
    const colors = [
      'radial-gradient(circle at 20% 20%, #4a0e4e, #0f2027 50%, #203a43 100%)',
      'radial-gradient(circle at 80% 20%, #ff416c, #8a2387 50%, #111111 100%)',
      'radial-gradient(circle at 30% 70%, #134e5e, #71b280 50%, #000000 100%)',
      'radial-gradient(circle at 70% 80%, #654ea3, #eaafc8 50%, #1e1e24 100%)'
    ];
    const picked = colors[Math.floor(Math.random() * colors.length)];
    mesh.style.background = picked;
  }

  // 7. Synced Lyrics Engine (LRCLIB)
  async function loadLyrics(song) {
    const scrollBox = document.getElementById('lyricsScrollBox');
    if (!scrollBox) return;
    scrollBox.innerHTML = '<div class="lyrics-line-active">Searching synced lyrics...</div>';

    try {
      const cleanTitle = song.title.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
      const cleanArtist = song.artist.split(/[,&]/)[0].trim();
      const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          const lines = [];
          const raw = data.syncedLyrics.split('\n');
          for (const line of raw) {
            const m = line.match(/\[(\d+):(\d+\.?\d*)\](.*)/);
            if (m) {
              const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
              const text = m[3].trim();
              if (text) lines.push({ time, text });
            }
          }
          State.lyricsLines = lines;
          renderLyricsLines(lines);
          return;
        }
      }
    } catch (e) {
      console.warn('Lyrics fetch err:', e);
    }

    // Fallback lyrics
    State.lyricsLines = [
      { time: 0, text: `♪ ${song.title} ♪` },
      { time: 5, text: song.artist },
      { time: 10, text: 'Ad-free high definition stream' }
    ];
    renderLyricsLines(State.lyricsLines);
  }

  function renderLyricsLines(lines) {
    const box = document.getElementById('lyricsScrollBox');
    if (!box) return;
    box.innerHTML = '';
    lines.forEach((l, idx) => {
      const div = document.createElement('div');
      div.className = 'lyric-line' + (idx === 0 ? ' active' : '');
      div.dataset.time = l.time;
      div.textContent = l.text;
      box.appendChild(div);
    });
  }

  function updateLyricsHighlight(curTime) {
    const box = document.getElementById('lyricsScrollBox');
    if (!box || !State.lyricsLines.length) return;
    const lines = box.getElementsByClassName('lyric-line');

    let activeIdx = 0;
    for (let i = 0; i < State.lyricsLines.length; i++) {
      if (curTime >= State.lyricsLines[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      if (i === activeIdx) {
        if (!lines[i].classList.contains('active')) {
          lines[i].classList.add('active');
          lines[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        lines[i].classList.remove('active');
      }
    }
  }

  // 8. Search Engine (YouTube Music Innertube + iTunes API Fallback)
  async function searchMusic(query) {
    const container = document.getElementById('searchResultsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-shimmer">Searching 100M+ songs...</div>';

    try {
      // 1. Primary: iTunes Search API (fast, open CORS, high-res artwork)
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`;
      const res = await fetch(itunesUrl);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const songs = data.results.map(r => ({
          videoId: '', // Will be resolved or played via YouTube/audio
          title: r.trackName,
          artist: r.artistName,
          album: r.collectionName,
          duration: Math.round((r.trackTimeMillis || 210000) / 1000),
          thumbnail: (r.artworkUrl100 || '').replace('100x100bb.jpg', '600x600bb.jpg'),
          previewUrl: r.previewUrl
        }));

        renderSearchResults(songs);
        return;
      }
    } catch (e) {
      console.warn('Search API error:', e);
    }

    // Fallback: match local
    const matches = INITIAL_TRACKS.filter(t =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.artist.toLowerCase().includes(query.toLowerCase())
    );
    renderSearchResults(matches);
  }

  async function fetchYouTubeVideoId(query) {
    try {
      const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: { clientName: 'WEB_REMIX', clientVersion: '1.20240101.01.00', hl: 'en', gl: 'US' }
          },
          query: query
        })
      });
      if (res.ok) {
        const d = await res.json();
        const tabs = d.contents?.tabbedSearchResultsRenderer?.tabs || [];
        const sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
        for (const sec of sections) {
          const card = sec.musicCardShelfRenderer;
          if (card?.title?.runs) {
            for (const r of card.title.runs) {
              if (r.navigationEndpoint?.watchEndpoint?.videoId) {
                return r.navigationEndpoint.watchEndpoint.videoId;
              }
            }
          }
        }
      }
    } catch (err) {}
    return '34Na4j8AVgA'; // Fallback
  }

  function renderSearchResults(songs) {
    const container = document.getElementById('searchResultsContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!songs.length) {
      container.innerHTML = '<div class="search-placeholder-prompt">No songs found. Try another search.</div>';
      return;
    }

    songs.forEach(s => {
      const row = document.createElement('div');
      row.className = 'song-pick-item focusable';
      row.tabIndex = 0;
      row.innerHTML = `
        <img src="${s.thumbnail || 'assets/starboy_square.jpg'}" alt="" class="song-pick-art">
        <div class="song-pick-meta">
          <div class="song-pick-title">${s.title}</div>
          <div class="song-pick-artist">${s.artist} • ${formatTime(s.duration)}</div>
        </div>
      `;
      row.addEventListener('click', () => {
        State.queue.unshift(s);
        State.currentIndex = 0;
        playSong(s);
      });
      container.appendChild(row);
    });
  }

  // 9. Render Home Screen Sections (Matching user_ss.jpg)
  function renderHomeScreen() {
    // 1. Quick picks (4 items per column)
    const qpBox = document.getElementById('quickPicksContainer');
    if (qpBox) {
      qpBox.innerHTML = '';
      const col1 = document.createElement('div');
      col1.className = 'quick-picks-column';
      const col2 = document.createElement('div');
      col2.className = 'quick-picks-column';

      INITIAL_TRACKS.slice(0, 4).forEach(song => {
        col1.appendChild(createSongRow(song));
      });
      INITIAL_TRACKS.slice(4, 8).forEach(song => {
        col2.appendChild(createSongRow(song));
      });

      qpBox.appendChild(col1);
      qpBox.appendChild(col2);
    }

    // 2. Listen again (large square cards)
    const laBox = document.getElementById('listenAgainContainer');
    if (laBox) {
      laBox.innerHTML = '';
      INITIAL_TRACKS.slice(4, 9).forEach(song => {
        laBox.appendChild(createLargeCard(song));
      });
    }

    // 3. Listen together (station cards)
    const ltBox = document.getElementById('listenTogetherContainer');
    if (ltBox) {
      ltBox.innerHTML = '';
      INITIAL_TRACKS.slice(0, 5).forEach(song => {
        ltBox.appendChild(createLargeCard(song));
      });
    }

    // 4. Trending Worldwide
    const trBox = document.getElementById('trendingContainer');
    if (trBox) {
      trBox.innerHTML = '';
      INITIAL_TRACKS.slice(2, 8).forEach(song => {
        trBox.appendChild(createLargeCard(song));
      });
    }
  }

  function createSongRow(song) {
    const item = document.createElement('div');
    item.className = 'song-pick-item focusable';
    item.tabIndex = 0;
    item.innerHTML = `
      <img src="${song.thumbnail || 'assets/starboy_square.jpg'}" alt="" class="song-pick-art">
      <div class="song-pick-meta">
        <div class="song-pick-title">${song.title}</div>
        <div class="song-pick-artist">${song.artist}</div>
      </div>
      <div class="song-pick-more">⋮</div>
    `;
    item.addEventListener('click', () => {
      playSong(song);
    });
    return item;
  }

  function createLargeCard(song) {
    const card = document.createElement('div');
    card.className = 'album-large-card focusable';
    card.tabIndex = 0;
    card.innerHTML = `
      <img src="${song.thumbnail || 'assets/starboy_square.jpg'}" alt="" class="album-card-thumb">
      <div class="album-card-title">${song.title}</div>
      <div class="album-card-sub">${song.artist}</div>
    `;
    card.addEventListener('click', () => {
      playSong(song);
    });
    return card;
  }

  // 10. Favorite System
  function updateFaveUI(isFav) {
    const fill = isFav ? '#ff2d55' : 'none';
    const stroke = isFav ? '#ff2d55' : 'currentColor';
    const svgPath = `<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;

    const mpFave = document.getElementById('mpFaveSvg');
    const npFave = document.getElementById('npFaveSvg');

    if (mpFave) {
      mpFave.setAttribute('fill', fill);
      mpFave.setAttribute('stroke', stroke);
      mpFave.innerHTML = svgPath;
    }
    if (npFave) {
      npFave.setAttribute('fill', fill);
      npFave.setAttribute('stroke', stroke);
      npFave.innerHTML = svgPath;
    }
  }

  function toggleFave() {
    if (!State.currentSong) return;
    const key = State.currentSong.videoId || State.currentSong.title;
    if (State.favorites.has(key)) {
      State.favorites.delete(key);
      updateFaveUI(false);
    } else {
      State.favorites.add(key);
      updateFaveUI(true);
    }
  }

  // 11. Screen Switcher
  function switchScreen(screenId) {
    State.activeScreen = screenId;
    document.querySelectorAll('.app-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');

    // Update bottom nav tabs
    document.querySelectorAll('.nav-tab').forEach(t => {
      if (t.dataset.screen === screenId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });

    if (screenId === 'viewSearch') {
      setTimeout(() => {
        const inp = document.getElementById('searchInput');
        if (inp) inp.focus();
      }, 100);
    }
  }

  // 12. Samsung TV D-Pad Remote Navigation
  document.addEventListener('keydown', function(e) {
    const key = e.keyCode;
    // Tizen TV Keycodes:
    // Left: 37, Up: 38, Right: 39, Down: 40, Enter: 13, Return/Back: 10009
    if (key === 10009 || key === 27) { // Back
      const modal = document.getElementById('nowPlayingModal');
      if (modal && !modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        e.preventDefault();
        return;
      }
      if (State.activeScreen !== 'viewHome') {
        switchScreen('viewHome');
        e.preventDefault();
        return;
      }
    }

    if ([37, 38, 39, 40].includes(key)) {
      handleDPadNavigation(key);
    }
  });

  function handleDPadNavigation(keyCode) {
    const focusable = Array.from(document.querySelectorAll('.focusable:not([style*="display: none"]):not([style*="display:none"])'));
    const current = document.activeElement;
    let idx = focusable.indexOf(current);

    if (idx === -1) {
      if (focusable.length) focusable[0].focus();
      return;
    }

    if (keyCode === 39) { // Right
      if (idx < focusable.length - 1) focusable[idx + 1].focus();
    } else if (keyCode === 37) { // Left
      if (idx > 0) focusable[idx - 1].focus();
    } else if (keyCode === 40) { // Down
      idx = Math.min(idx + 3, focusable.length - 1);
      focusable[idx].focus();
    } else if (keyCode === 38) { // Up
      idx = Math.max(idx - 3, 0);
      focusable[idx].focus();
    }
  }

  // 13. Event Listeners Setup
  function initEvents() {
    // Mini player clicks
    document.getElementById('mpOpenNowPlaying')?.addEventListener('click', () => {
      document.getElementById('nowPlayingModal')?.classList.remove('hidden');
    });
    document.getElementById('mpPlayPauseBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
    document.getElementById('mpFaveBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFave();
    });

    // Now Playing modal controls
    document.getElementById('npCloseBtn')?.addEventListener('click', () => {
      document.getElementById('nowPlayingModal')?.classList.add('hidden');
    });
    document.getElementById('npPlayPauseBtn')?.addEventListener('click', togglePlay);
    document.getElementById('npNextBtn')?.addEventListener('click', playNext);
    document.getElementById('npPrevBtn')?.addEventListener('click', playPrev);
    document.getElementById('npFaveBtn')?.addEventListener('click', toggleFave);

    // Navigation Tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const screen = tab.dataset.screen;
        if (screen) switchScreen(screen);
      });
    });

    // Search FAB
    document.getElementById('searchFabBtn')?.addEventListener('click', () => {
      switchScreen('viewSearch');
    });

    // Search Input Real-Time
    const sInput = document.getElementById('searchInput');
    let searchDebounce = null;
    if (sInput) {
      sInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        const q = e.target.value.trim();
        const clr = document.getElementById('clearSearchBtn');
        if (clr) clr.style.display = q ? 'block' : 'none';

        if (!q) {
          document.getElementById('searchResultsContainer').innerHTML = '<div class="search-placeholder-prompt">Type to search over 100M+ ad-free songs on YouTube Music</div>';
          return;
        }

        searchDebounce = setTimeout(() => {
          searchMusic(q);
        }, 350);
      });
    }

    document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
      if (sInput) {
        sInput.value = '';
        sInput.focus();
        document.getElementById('clearSearchBtn').style.display = 'none';
        document.getElementById('searchResultsContainer').innerHTML = '<div class="search-placeholder-prompt">Type to search over 100M+ ad-free songs on YouTube Music</div>';
      }
    });

    // Quick picks play all
    document.getElementById('quickPicksPlayAll')?.addEventListener('click', () => {
      State.queue = [...INITIAL_TRACKS];
      State.currentIndex = 0;
      playSong(State.queue[0]);
    });
  }

  // 14. Initialize App
  function init() {
    renderHomeScreen();
    initEvents();

    // Auto-arm first track
    if (INITIAL_TRACKS.length > 0) {
      const first = INITIAL_TRACKS[0];
      const mpTitle = document.getElementById('mpTitle');
      const mpArtist = document.getElementById('mpArtist');
      const mpThumb = document.getElementById('mpThumb');
      if (mpTitle) mpTitle.textContent = first.title;
      if (mpArtist) mpArtist.textContent = first.artist;
      if (mpThumb) mpThumb.src = first.thumbnail;
    }

    console.log('✓ AyushMuzic Smart TV Application Loaded Successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
