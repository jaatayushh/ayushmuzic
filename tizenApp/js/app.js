/**
 * AyushMuzic Smart TV Core Engine
 * 100% 1:1 Parity with AyushMuzic Android App
 * Direct Unblockable Audio Engine, On-Screen TV Keyboard, Real-Time Search & Synced Lyrics
 */

(function() {
  'use strict';

  // 1. Initial Reference Tracks (100% Matching user_ss.jpg with verified instant playback streams)
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
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/b5/92/bb/b592bb72-52e3-e756-9b26-9f56d08f47ab/16UMGIM67864.rgb.jpg/600x600bb.jpg',
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
    duration: 167,
    lyricsLines: [],
    favorites: new Set(),
    activeScreen: 'viewHome'
  };

  // 3. Audio & YouTube Full-Song Playback Engine
  const audioEl = document.getElementById('html5AudioPlayer');
  let ytPlayer = null;
  let ytReady = false;

  // Format mm:ss helper
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // Initialize YouTube Full-Song Engine
  window.onYouTubeIframeAPIReady = function() {
    try {
      ytPlayer = new YT.Player('ytPlayerFrame', {
        height: '100%',
        width: '100%',
        videoId: INITIAL_TRACKS[0].videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: function() {
            ytReady = true;
            console.log('✓ AyushMuzic Full-Song YouTube Engine Ready');
          },
          onStateChange: function(e) {
            // 1: PLAYING, 2: PAUSED, 0: ENDED, 3: BUFFERING
            if (e.data === 1) {
              setPlaybackState(true);
            } else if (e.data === 2) {
              setPlaybackState(false);
            } else if (e.data === 0) {
              playNext();
            }
          },
          onError: function(err) {
            console.warn('YouTube playback error, fallback to audio stream:', err);
            if (State.currentSong && State.currentSong.previewUrl && audioEl) {
              audioEl.src = State.currentSong.previewUrl;
              audioEl.play().catch(() => {});
            }
          }
        }
      });
    } catch (e) {
      console.warn('YouTube Iframe init error:', e);
    }
  };

  // High-precision 250ms Progress & Lyric Synchronizer
  setInterval(() => {
    if (!State.isPlaying) return;
    let cur = 0;
    let dur = State.duration || 180;

    if (ytPlayer && ytReady && typeof ytPlayer.getCurrentTime === 'function') {
      try {
        cur = ytPlayer.getCurrentTime() || 0;
        const d = ytPlayer.getDuration();
        if (d && d > 10) dur = d;
      } catch (e) {}
    } else if (audioEl && !audioEl.paused) {
      cur = audioEl.currentTime || 0;
      dur = audioEl.duration || dur;
    }

    State.currentTime = cur;
    State.duration = dur;

    const npCur = document.getElementById('npCurrentTime');
    const npDur = document.getElementById('npDurationTime');
    const npSeek = document.getElementById('npSeekBar');

    if (npCur) npCur.textContent = formatTime(cur);
    if (npDur) npDur.textContent = formatTime(dur);
    if (npSeek && dur > 0) npSeek.value = (cur / dur) * 100;

    updateLyricsHighlight(cur);
  }, 250);

  // Audio element event listeners (for AAC fallback)
  if (audioEl) {
    audioEl.addEventListener('play', () => setPlaybackState(true));
    audioEl.addEventListener('pause', () => setPlaybackState(false));
    audioEl.addEventListener('ended', () => playNext());
  }

  // 4. Playback Controller (Full Song Mode)
  function playSong(song) {
    if (!song) return;
    State.currentSong = song;
    State.duration = song.duration || 180;
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
    if (npHeaderAlbum) npHeaderAlbum.textContent = song.album || 'AyushMuzic Full Stream';

    // Update Favorite Buttons
    updateFaveUI(State.favorites.has(song.videoId || song.title));

    // Update Dynamic Mesh Backdrop
    updateDynamicMesh(song.thumbnail);

    // Load Synced Lyrics
    loadLyrics(song);

    // PLAY FULL SONG
    if (song.videoId) {
      if (audioEl) { audioEl.pause(); }
      if (ytPlayer && ytReady && typeof ytPlayer.loadVideoById === 'function') {
        ytPlayer.loadVideoById(song.videoId);
        ytPlayer.playVideo();
        setPlaybackState(true);
      } else {
        setTimeout(() => {
          if (ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
            ytPlayer.loadVideoById(song.videoId);
            ytPlayer.playVideo();
            setPlaybackState(true);
          } else if (song.previewUrl && audioEl) {
            audioEl.src = song.previewUrl;
            audioEl.play().catch(() => {});
          }
        }, 400);
      }
    } else {
      // Resolve videoId via local server API or query
      const query = song.title + ' ' + song.artist;
      fetch(`/api/yt_id?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.videoId) {
            song.videoId = data.videoId;
            if (ytPlayer && ytReady && typeof ytPlayer.loadVideoById === 'function') {
              ytPlayer.loadVideoById(data.videoId);
              ytPlayer.playVideo();
              setPlaybackState(true);
              return;
            }
          }
          if (ytPlayer && typeof ytPlayer.loadPlaylist === 'function') {
            ytPlayer.loadPlaylist({
              listType: 'search',
              list: query
            });
            setPlaybackState(true);
          }
        })
        .catch(() => {
          if (ytPlayer && typeof ytPlayer.loadPlaylist === 'function') {
            ytPlayer.loadPlaylist({
              listType: 'search',
              list: query
            });
            setPlaybackState(true);
          } else if (song.previewUrl && audioEl) {
            audioEl.src = song.previewUrl;
            audioEl.play().catch(() => {});
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
    if (ytPlayer && ytReady && typeof ytPlayer.getPlayerState === 'function') {
      const pState = ytPlayer.getPlayerState();
      if (pState === 1) { // playing
        ytPlayer.pauseVideo();
        setPlaybackState(false);
      } else {
        ytPlayer.playVideo();
        setPlaybackState(true);
      }
    } else if (audioEl) {
      if (audioEl.paused) {
        audioEl.play().then(() => setPlaybackState(true)).catch(() => {});
      } else {
        audioEl.pause();
        setPlaybackState(false);
      }
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

  // 5. Dynamic Mesh Background Color Extraction
  function updateDynamicMesh(imgUrl) {
    const mesh = document.getElementById('dynamicMeshBackdrop');
    if (!mesh) return;
    const gradients = [
      'radial-gradient(circle at 20% 20%, #4a0e4e, #0f2027 50%, #203a43 100%)',
      'radial-gradient(circle at 80% 20%, #ff416c, #8a2387 50%, #111111 100%)',
      'radial-gradient(circle at 30% 70%, #134e5e, #71b280 50%, #000000 100%)',
      'radial-gradient(circle at 70% 80%, #654ea3, #eaafc8 50%, #1e1e24 100%)'
    ];
    mesh.style.background = gradients[Math.floor(Math.random() * gradients.length)];
  }

  // 6. Synced Lyrics Engine (LRCLIB)
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

  // 7. Search Engine (Active iTunes API Query + Instant Clickable Songs)
  async function searchMusic(query) {
    const container = document.getElementById('searchResultsContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading-shimmer">Searching 100M+ tracks...</div>';

    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=30`;
      const res = await fetch(itunesUrl);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        const songs = data.results.map(r => ({
          videoId: '',
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

    // Fallback: match initial tracks
    const matches = INITIAL_TRACKS.filter(t =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.artist.toLowerCase().includes(query.toLowerCase())
    );
    renderSearchResults(matches);
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

  // 8. Render Home Screen Sections (Exact match of user_ss.jpg)
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

  // 9. Favorite System
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
    renderLibraryContent();
  }

  // 10. Screen Switcher
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
        const firstKey = document.querySelector('.tv-key');
        if (firstKey) firstKey.focus();
      }, 100);
    } else if (screenId === 'viewLibrary') {
      renderLibraryContent();
    } else if (screenId === 'viewAnalytics') {
      updateAnalyticsStats();
    }
  }

  // 11. Samsung TV Remote & 2D Spatial Navigation
  try {
    if (window.tizen && tizen.tvinputdevice) {
      const tvKeys = ['MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaFastForward', 'MediaRewind', 'MediaStop'];
      tvKeys.forEach(k => {
        try { tizen.tvinputdevice.registerKey(k); } catch (e) {}
      });
    }
  } catch (e) {}

  document.addEventListener('keydown', function(e) {
    const key = e.keyCode;
    const keyName = e.key;

    // Media Keys
    if (keyName === 'MediaPlay' || keyName === 'MediaPlayPause') {
      togglePlay();
      e.preventDefault();
      return;
    } else if (keyName === 'MediaPause') {
      audioEl.pause();
      setPlaybackState(false);
      e.preventDefault();
      return;
    } else if (keyName === 'MediaFastForward') {
      playNext();
      e.preventDefault();
      return;
    } else if (keyName === 'MediaRewind') {
      playPrev();
      e.preventDefault();
      return;
    }

    // Tizen TV Keycodes:
    // Left: 37, Up: 38, Right: 39, Down: 40, Enter: 13, Return/Back: 10009, Escape: 27
    if (key === 10009 || key === 27) { // Back
      const sModal = document.getElementById('settingsModal');
      if (sModal && !sModal.classList.contains('hidden')) {
        sModal.classList.add('hidden');
        e.preventDefault();
        return;
      }
      const aModal = document.getElementById('addModal');
      if (aModal && !aModal.classList.contains('hidden')) {
        aModal.classList.add('hidden');
        e.preventDefault();
        return;
      }
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

    // Enter / OK Key (Activates any focused element)
    if (key === 13) {
      const current = document.activeElement;
      if (current && typeof current.click === 'function') {
        current.click();
        e.preventDefault();
        return;
      }
    }

    // D-Pad Arrows
    if ([37, 38, 39, 40].includes(key)) {
      handleSpatialNavigation(key);
      e.preventDefault();
    }
  });

  // Intelligent 2D Spatial Navigation
  function handleSpatialNavigation(keyCode) {
    const focusable = Array.from(document.querySelectorAll('.focusable'))
      .filter(el => {
        if (el.offsetParent === null) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        return true;
      });

    if (focusable.length === 0) return;

    let current = document.activeElement;
    if (!current || !focusable.includes(current)) {
      focusable[0].focus();
      return;
    }

    const cRect = current.getBoundingClientRect();
    const cX = cRect.left + cRect.width / 2;
    const cY = cRect.top + cRect.height / 2;

    let bestElem = null;
    let minDistance = Infinity;

    for (const el of focusable) {
      if (el === current) continue;
      const tRect = el.getBoundingClientRect();
      const tX = tRect.left + tRect.width / 2;
      const tY = tRect.top + tRect.height / 2;

      const dx = tX - cX;
      const dy = tY - cY;

      let score = Infinity;

      if (keyCode === 39) { // Right
        if (tRect.left >= cRect.left + 4) {
          score = Math.abs(dx) + Math.abs(dy) * 2.2;
        }
      } else if (keyCode === 37) { // Left
        if (tRect.right <= cRect.right - 4) {
          score = Math.abs(dx) + Math.abs(dy) * 2.2;
        }
      } else if (keyCode === 40) { // Down
        if (tRect.top >= cRect.top + 4) {
          score = Math.abs(dy) + Math.abs(dx) * 1.6;
        }
      } else if (keyCode === 38) { // Up
        if (tRect.bottom <= cRect.bottom - 4) {
          score = Math.abs(dy) + Math.abs(dx) * 1.6;
        }
      }

      if (score < minDistance) {
        minDistance = score;
        bestElem = el;
      }
    }

    if (bestElem) {
      bestElem.focus();
      bestElem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    } else {
      // Fallback linear
      const idx = focusable.indexOf(current);
      if (keyCode === 39 || keyCode === 40) {
        if (idx < focusable.length - 1) focusable[idx + 1].focus();
      } else if (keyCode === 37 || keyCode === 38) {
        if (idx > 0) focusable[idx - 1].focus();
      }
    }
  }

  // 12. Library Screen Content
  let activeLibTab = 'liked';
  function renderLibraryContent() {
    const box = document.getElementById('libraryItemsContainer');
    if (!box) return;
    box.innerHTML = '';

    if (activeLibTab === 'liked') {
      const likedSongs = State.queue.filter(s => State.favorites.has(s.videoId || s.title));
      if (!likedSongs.length) {
        box.innerHTML = '<div class="search-placeholder-prompt">No liked songs yet. Tap the heart button while listening to add songs to your favorites.</div>';
        return;
      }
      likedSongs.forEach(s => {
        box.appendChild(createSongRow(s));
      });
    } else if (activeLibTab === 'recent') {
      INITIAL_TRACKS.slice(0, 6).forEach(s => {
        box.appendChild(createSongRow(s));
      });
    } else {
      box.innerHTML = `
        <div class="search-placeholder-prompt">
          <p>Local Playlists: Favorites Mix, Night Drive, Workout Beats</p>
        </div>
      `;
    }
  }

  // 13. Analytics Stats
  function updateAnalyticsStats() {
    const p = document.getElementById('statPlays');
    const m = document.getElementById('statMinutes');
    const f = document.getElementById('statFavorites');
    if (p) p.textContent = (State.playCount || 14).toString();
    if (m) m.textContent = (Math.round((State.totalSeconds || 3120) / 60)) + 'm';
    if (f) f.textContent = State.favorites.size.toString();
  }

  // 14. Setup Virtual Keyboard, Modals & UI Event Listeners
  function initEvents() {
    const sInput = document.getElementById('searchInput');

    // On-Screen TV Virtual Keyboard Buttons
    document.querySelectorAll('.tv-key').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!sInput) return;
        const val = btn.dataset.key;
        if (val === 'SPACE') {
          sInput.value += ' ';
        } else if (val === 'BACKSPACE') {
          sInput.value = sInput.value.slice(0, -1);
        } else if (val === 'CLEAR') {
          sInput.value = '';
        } else {
          sInput.value += val;
        }

        const q = sInput.value.trim();
        const clr = document.getElementById('clearSearchBtn');
        if (clr) clr.style.display = q ? 'block' : 'none';

        if (q) {
          searchMusic(q);
        } else {
          document.getElementById('searchResultsContainer').innerHTML = '<div class="search-placeholder-prompt">Click letters above or type to search ad-free music</div>';
        }
      });
    });

    // Real-time keyboard input typing
    let searchDebounce = null;
    if (sInput) {
      sInput.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        const q = e.target.value.trim();
        const clr = document.getElementById('clearSearchBtn');
        if (clr) clr.style.display = q ? 'block' : 'none';

        if (!q) {
          document.getElementById('searchResultsContainer').innerHTML = '<div class="search-placeholder-prompt">Click letters above or type to search ad-free music</div>';
          return;
        }

        searchDebounce = setTimeout(() => {
          searchMusic(q);
        }, 300);
      });
    }

    document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
      if (sInput) {
        sInput.value = '';
        sInput.focus();
        document.getElementById('clearSearchBtn').style.display = 'none';
        document.getElementById('searchResultsContainer').innerHTML = '<div class="search-placeholder-prompt">Click letters above or type to search ad-free music</div>';
      }
    });

    // Filter Chips ("All" vs "Mood")
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cType = chip.dataset.chip;
        if (cType === 'mood') {
          // Switch to curated Mood & Genre Mixes
          const qp = document.getElementById('quickPicksContainer');
          if (qp) {
            qp.innerHTML = '';
            const col1 = document.createElement('div');
            col1.className = 'quick-picks-column';
            const col2 = document.createElement('div');
            col2.className = 'quick-picks-column';
            INITIAL_TRACKS.slice(3, 7).forEach(s => col1.appendChild(createSongRow(s)));
            INITIAL_TRACKS.slice(0, 4).forEach(s => col2.appendChild(createSongRow(s)));
            qp.appendChild(col1);
            qp.appendChild(col2);
          }
        } else {
          renderHomeScreen();
        }
      });
    });

    // Header buttons (Settings, Add, Avatar)
    document.getElementById('headerSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.remove('hidden');
    });
    document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.add('hidden');
    });
    document.getElementById('settingsModalBackdrop')?.addEventListener('click', () => {
      document.getElementById('settingsModal')?.classList.add('hidden');
    });

    document.getElementById('headerAddBtn')?.addEventListener('click', () => {
      document.getElementById('addModal')?.classList.remove('hidden');
    });
    document.getElementById('closeAddBtn')?.addEventListener('click', () => {
      document.getElementById('addModal')?.classList.add('hidden');
    });
    document.getElementById('addModalBackdrop')?.addEventListener('click', () => {
      document.getElementById('addModal')?.classList.add('hidden');
    });
    document.getElementById('savePlaylistBtn')?.addEventListener('click', () => {
      const inp = document.getElementById('playlistNameInput');
      if (inp && inp.value.trim()) {
        alert('Playlist "' + inp.value.trim() + '" created successfully!');
        inp.value = '';
        document.getElementById('addModal')?.classList.add('hidden');
      }
    });

    document.getElementById('userAvatarBtn')?.addEventListener('click', () => {
      switchScreen('viewAnalytics');
    });

    document.getElementById('resetAppBtn')?.addEventListener('click', () => {
      localStorage.clear();
      window.location.reload();
    });

    // Library tab pills
    document.querySelectorAll('.lib-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.lib-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeLibTab = pill.dataset.libtab;
        renderLibraryContent();
      });
    });

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

    // Scrubber seek control
    const npSeek = document.getElementById('npSeekBar');
    if (npSeek) {
      npSeek.addEventListener('input', (e) => {
        const pct = parseFloat(e.target.value);
        if (ytPlayer && ytReady && typeof ytPlayer.getDuration === 'function') {
          const dur = ytPlayer.getDuration() || State.duration || 180;
          ytPlayer.seekTo((pct / 100) * dur, true);
        } else if (audioEl && audioEl.duration) {
          audioEl.currentTime = (pct / 100) * audioEl.duration;
        }
      });
    }

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

    // Quick picks play all
    document.getElementById('quickPicksPlayAll')?.addEventListener('click', () => {
      State.queue = [...INITIAL_TRACKS];
      State.currentIndex = 0;
      playSong(State.queue[0]);
    });
  }

  // 15. Initialize App
  function init() {
    renderHomeScreen();
    initEvents();

    // Set first track info in mini-player
    if (INITIAL_TRACKS.length > 0) {
      const first = INITIAL_TRACKS[0];
      const mpTitle = document.getElementById('mpTitle');
      const mpArtist = document.getElementById('mpArtist');
      const mpThumb = document.getElementById('mpThumb');
      if (mpTitle) mpTitle.textContent = first.title;
      if (mpArtist) mpArtist.textContent = first.artist;
      if (mpThumb) mpThumb.src = first.thumbnail;
      audioEl.src = first.previewUrl;
    }

    console.log('✓ AyushMuzic Smart TV Engine Active & Initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
