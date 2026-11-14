/**
 * AyushMuzic Smart TV Core Engine
 * 100% Native Pure Audio Engine (HTML5 <audio>)
 * Background Audio & Screen-Off Playback on Samsung Smart TV
 * Real-Time Search, Live Synced LRCLIB Lyrics, AMOLED UI & Full Remote Navigation
 */

(function() {
  'use strict';

  // 1. Initial High-Fidelity Music Catalog (Popular Trending Hits — No Mismatches)
  const INITIAL_TRACKS = [
    {
      id: 'BddP6PYo2gs',
      title: 'Kesariya',
      artist: 'Arijit Singh, Pritam',
      album: 'Brahmāstra',
      duration: 268,
      thumbnail: 'https://i.ytimg.com/vi/BddP6PYo2gs/hqdefault.jpg'
    },
    {
      id: 'VAdGW7QDJUI',
      title: 'Chaleya',
      artist: 'Arijit Singh, Shilpa Rao, Anirudh',
      album: 'Jawan',
      duration: 200,
      thumbnail: 'https://i.ytimg.com/vi/VAdGW7QDJUI/hqdefault.jpg'
    },
    {
      id: '34Na4j8AVgA',
      title: 'Starboy',
      artist: 'The Weeknd, Daft Punk',
      album: 'Starboy',
      duration: 230,
      thumbnail: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg'
    },
    {
      id: '4NRXx6U8ABQ',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      duration: 200,
      thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg'
    },
    {
      id: 'ElZfdU54Cp8',
      title: 'Apna Bana Le',
      artist: 'Arijit Singh, Sachin-Jigar',
      album: 'Bhediya',
      duration: 261,
      thumbnail: 'https://i.ytimg.com/vi/ElZfdU54Cp8/hqdefault.jpg'
    },
    {
      id: 'RLzC55ai0eo',
      title: 'Heeriye',
      artist: 'Jasleen Royal, Arijit Singh',
      album: 'Heeriye - Single',
      duration: 194,
      thumbnail: 'https://i.ytimg.com/vi/RLzC55ai0eo/hqdefault.jpg'
    },
    {
      id: '2g89sFz8p3o',
      title: 'Pehle Bhi Main',
      artist: 'Vishal Mishra, Raj Shekhar',
      album: 'ANIMAL',
      duration: 250,
      thumbnail: 'https://i.ytimg.com/vi/2g89sFz8p3o/hqdefault.jpg'
    },
    {
      id: 'syFZfO_wfMQ',
      title: 'Night Changes',
      artist: 'One Direction',
      album: 'FOUR',
      duration: 227,
      thumbnail: 'https://i.ytimg.com/vi/syFZfO_wfMQ/hqdefault.jpg'
    },
    {
      id: 'gvhmsuL86fE',
      title: 'Husn',
      artist: 'Anuv Jain',
      album: 'Husn - Single',
      duration: 217,
      thumbnail: 'https://i.ytimg.com/vi/gvhmsuL86fE/hqdefault.jpg'
    },
    {
      id: '8v-TWxPwi0o',
      title: 'O Maahi',
      artist: 'Arijit Singh, Pritam',
      album: 'Dunki',
      duration: 233,
      thumbnail: 'https://i.ytimg.com/vi/8v-TWxPwi0o/hqdefault.jpg'
    },
    {
      id: 'HrNRfltwXnE',
      title: 'Satranga',
      artist: 'Arijit Singh, Shreyas Puranik',
      album: 'ANIMAL',
      duration: 271,
      thumbnail: 'https://i.ytimg.com/vi/HrNRfltwXnE/hqdefault.jpg'
    },
    {
      id: 'AgX2II9si7w',
      title: 'Tujhe Kitna Chahne Lage',
      artist: 'Arijit Singh, Mithoon',
      album: 'Kabir Singh',
      duration: 284,
      thumbnail: 'https://i.ytimg.com/vi/AgX2II9si7w/hqdefault.jpg'
    }
  ];

  // 2. Application State
  const State = {
    queue: [...INITIAL_TRACKS],
    currentIndex: 0,
    currentSong: INITIAL_TRACKS[0],
    isPlaying: false,
    currentTime: 0,
    duration: 268,
    isShuffle: false,
    repeatMode: 0, // 0: off, 1: all, 2: one
    lyricsLines: [],
    favorites: new Set(),
    activeScreen: 'viewHome',
    searchQuery: '',
    searchDebounceTimer: null,
    nowPlayingOpen: false
  };

  // 3. Native Audio Player Engine (100% Pure HTML5 — Zero Video, Zero Iframe, Screen-Off Safe)
  const audioEl = document.getElementById('html5AudioPlayer');
  
  // Configure audio attributes for TV & background playback
  if (audioEl) {
    audioEl.preload = 'auto';
    audioEl.crossOrigin = 'anonymous';
  }

  // 4. UI Elements
  const UI = {
    quickPicksContainer: document.getElementById('quickPicksContainer'),
    listenAgainContainer: document.getElementById('listenAgainContainer'),
    listenTogetherContainer: document.getElementById('listenTogetherContainer'),
    trendingContainer: document.getElementById('trendingContainer'),
    
    // Mini Player
    miniPlayer: document.getElementById('miniPlayerBar'),
    miniCover: document.getElementById('miniCover'),
    miniTitle: document.getElementById('miniTitle'),
    miniArtist: document.getElementById('miniArtist'),
    miniPlayBtn: document.getElementById('miniPlayBtn'),
    miniNextBtn: document.getElementById('miniNextBtn'),
    miniProgressBar: document.getElementById('miniProgressBar'),
    miniHeartBtn: document.getElementById('miniHeartBtn'),

    // Now Playing Modal
    nowPlayingScreen: document.getElementById('nowPlayingScreen'),
    npBgBlur: document.getElementById('npBgBlur'),
    npCover: document.getElementById('npCover'),
    npTitle: document.getElementById('npTitle'),
    npArtist: document.getElementById('npArtist'),
    npCurrentTime: document.getElementById('npCurrentTime'),
    npDuration: document.getElementById('npDuration'),
    npSeekSlider: document.getElementById('npSeekSlider'),
    npPlayBtn: document.getElementById('npPlayBtn'),
    npPrevBtn: document.getElementById('npPrevBtn'),
    npNextBtn: document.getElementById('npNextBtn'),
    npHeartBtn: document.getElementById('npHeartBtn'),
    npShuffleBtn: document.getElementById('npShuffleBtn'),
    npRepeatBtn: document.getElementById('npRepeatBtn'),
    npCloseBtn: document.getElementById('npCloseBtn'),
    npLyricsColumn: document.getElementById('npLyricsColumn'),
    lyricsScrollBox: document.getElementById('lyricsScrollBox'),

    // Navigation & Views
    navHome: document.getElementById('navHome'),
    navSearch: document.getElementById('navSearch'),
    navLibrary: document.getElementById('navLibrary'),
    viewHome: document.getElementById('viewHome'),
    viewSearch: document.getElementById('viewSearch'),
    viewLibrary: document.getElementById('viewLibrary'),

    // Search
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    searchResultsContainer: document.getElementById('searchResultsContainer'),
    virtualKeyboard: document.getElementById('virtualKeyboard'),

    // Modals
    headerSettingsBtn: document.getElementById('headerSettingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeSettingsBtn: document.getElementById('closeSettingsBtn'),
    settingsModalBackdrop: document.getElementById('settingsModalBackdrop'),
    headerAddBtn: document.getElementById('headerAddBtn'),
    addModal: document.getElementById('addModal'),
    closeAddBtn: document.getElementById('closeAddBtn'),
    addModalBackdrop: document.getElementById('addModalBackdrop')
  };

  // ════════════════════════════════════════════════════════════════
  // 5. STREAM RESOLUTION ENGINE (Multi-Tier Full Song Extractor)
  // ════════════════════════════════════════════════════════════════
  async function resolveAudioStream(song) {
    if (song.streamUrl && !song.streamUrl.includes('apple.com')) {
      return song.streamUrl;
    }

    const host = (window.location && window.location.origin && window.location.origin.startsWith('http'))
      ? window.location.origin
      : 'http://localhost:8080';

    const query = `${song.title} ${song.artist}`.trim();

    // TIER 1: Local Dev Server / yt-dlp High-Speed Audio Engine
    try {
      const endpoint = song.id
        ? `${host}/api/stream?id=${encodeURIComponent(song.id)}`
        : `${host}/api/stream?q=${encodeURIComponent(query)}`;

      const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.streamUrl || data.proxyUrl)) {
          const direct = data.streamUrl || `${host}${data.proxyUrl}`;
          song.streamUrl = direct;
          if (data.duration) song.duration = data.duration;
          if (data.cover && !song.thumbnail) song.thumbnail = data.cover;
          return direct;
        }
      }
    } catch (e) {
      console.log('Tier 1 stream error:', e);
    }

    // TIER 2: Direct High-Quality Cloud Saavn CDN Stream (320kbps / 160kbps AAC MP4)
    try {
      const sUrl = `https://jiosaavn-api-2.vercel.app/search/songs?query=${encodeURIComponent(query)}`;
      const sRes = await fetch(sUrl, { signal: AbortSignal.timeout(5000) });
      if (sRes.ok) {
        const sData = await sRes.json();
        const results = sData.results || (sData.data && sData.data.results);
        if (results && results.length > 0) {
          const match = results[0];
          const dls = match.downloadUrl || [];
          if (dls.length > 0) {
            const best = dls[dls.length - 1].link;
            song.streamUrl = best;
            if (match.duration) song.duration = parseInt(match.duration, 10);
            return best;
          }
        }
      }
    } catch (e) {
      console.log('Tier 2 Saavn stream error:', e);
    }

    // TIER 3: Fallback Audio Preview
    return song.previewUrl || '';
  }

  // ════════════════════════════════════════════════════════════════
  // 6. AUDIO PLAYBACK CONTROLLER
  // ════════════════════════════════════════════════════════════════
  async function playTrack(song, newQueue = null) {
    if (!song) return;

    if (newQueue) {
      State.queue = [...newQueue];
      State.currentIndex = State.queue.findIndex(s => (s.id === song.id || s.title === song.title));
      if (State.currentIndex === -1) State.currentIndex = 0;
    }

    State.currentSong = song;
    updateTrackMetadataUI(song);

    // Show loading state in mini progress bar
    if (UI.miniProgressBar) {
      UI.miniProgressBar.style.width = '20%';
    }

    try {
      const streamUrl = await resolveAudioStream(song);
      if (!streamUrl) {
        console.error('No audio stream available for:', song.title);
        return;
      }

      audioEl.src = streamUrl;
      const playPromise = audioEl.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          State.isPlaying = true;
          updatePlaybackStateUI(true);
        }).catch(err => {
          console.warn('Playback auto-play blocked or error:', err);
          State.isPlaying = false;
          updatePlaybackStateUI(false);
        });
      }

      // Fetch Synced Lyrics
      fetchLyrics(song.title, song.artist, song.duration);

    } catch (ex) {
      console.error('Playback failed:', ex);
    }
  }

  function togglePlayPause() {
    if (!audioEl.src) {
      if (State.currentSong) playTrack(State.currentSong);
      return;
    }

    if (audioEl.paused) {
      audioEl.play().then(() => {
        State.isPlaying = true;
        updatePlaybackStateUI(true);
      }).catch(console.error);
    } else {
      audioEl.pause();
      State.isPlaying = false;
      updatePlaybackStateUI(false);
    }
  }

  function playNext() {
    if (State.queue.length === 0) return;
    if (State.repeatMode === 2) { // Repeat one
      audioEl.currentTime = 0;
      audioEl.play();
      return;
    }

    if (State.isShuffle) {
      State.currentIndex = Math.floor(Math.random() * State.queue.length);
    } else {
      State.currentIndex = (State.currentIndex + 1) % State.queue.length;
    }
    playTrack(State.queue[State.currentIndex]);
  }

  function playPrevious() {
    if (State.queue.length === 0) return;
    if (audioEl.currentTime > 4) {
      audioEl.currentTime = 0;
      return;
    }
    State.currentIndex = (State.currentIndex - 1 + State.queue.length) % State.queue.length;
    playTrack(State.queue[State.currentIndex]);
  }

  function seekTo(seconds) {
    if (audioEl && isFinite(seconds)) {
      audioEl.currentTime = seconds;
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 7. NATIVE AUDIO EVENT LISTENERS
  // ════════════════════════════════════════════════════════════════
  if (audioEl) {
    audioEl.addEventListener('timeupdate', () => {
      State.currentTime = audioEl.currentTime;
      State.duration = audioEl.duration || State.currentSong.duration || 240;
      updateProgressUI(State.currentTime, State.duration);
      syncLyricsWithTime(State.currentTime);
    });

    audioEl.addEventListener('play', () => {
      State.isPlaying = true;
      updatePlaybackStateUI(true);
    });

    audioEl.addEventListener('pause', () => {
      State.isPlaying = false;
      updatePlaybackStateUI(false);
    });

    audioEl.addEventListener('ended', () => {
      playNext();
    });

    audioEl.addEventListener('error', (e) => {
      console.warn('HTML5 Audio encountered error:', e);
      // Auto-skip or retry
      setTimeout(playNext, 1200);
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 8. UI UPDATERS (Mini-Player & Full Now Playing)
  // ════════════════════════════════════════════════════════════════
  function formatTime(sec) {
    if (isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updateTrackMetadataUI(song) {
    const coverUrl = song.thumbnail || 'assets/starboy_square.jpg';
    if (UI.miniCover) UI.miniCover.src = coverUrl;
    if (UI.miniTitle) UI.miniTitle.textContent = song.title;
    if (UI.miniArtist) UI.miniArtist.textContent = song.artist;

    if (UI.npCover) UI.npCover.src = coverUrl;
    if (UI.npTitle) UI.npTitle.textContent = song.title;
    if (UI.npArtist) UI.npArtist.textContent = song.artist;
    if (UI.npBgBlur) UI.npBgBlur.style.backgroundImage = `url('${coverUrl}')`;

    updateFaveUI(State.favorites.has(song.id || song.title));
  }

  function updatePlaybackStateUI(playing) {
    const playIconSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const pauseIconSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

    if (UI.miniPlayBtn) UI.miniPlayBtn.innerHTML = playing ? pauseIconSvg : playIconSvg;
    if (UI.npPlayBtn) UI.npPlayBtn.innerHTML = playing ? pauseIconSvg : playIconSvg;
  }

  function updateProgressUI(current, duration) {
    const pct = duration > 0 ? (current / duration) * 100 : 0;
    if (UI.miniProgressBar) {
      UI.miniProgressBar.style.width = `${pct}%`;
    }
    if (UI.npCurrentTime) UI.npCurrentTime.textContent = formatTime(current);
    if (UI.npDuration) UI.npDuration.textContent = formatTime(duration);
    if (UI.npSeekSlider) {
      UI.npSeekSlider.value = pct;
      UI.npSeekSlider.style.background = `linear-gradient(to right, #2bd3ff 0%, #2bd3ff ${pct}%, rgba(255,255,255,0.2) ${pct}%, rgba(255,255,255,0.2) 100%)`;
    }
  }

  function updateFaveUI(isFaved) {
    const color = isFaved ? '#ff3b30' : 'currentColor';
    const fill = isFaved ? '#ff3b30' : 'none';
    const heartSvg = `<svg viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="2"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    if (UI.miniHeartBtn) UI.miniHeartBtn.innerHTML = heartSvg;
    if (UI.npHeartBtn) UI.npHeartBtn.innerHTML = heartSvg;
  }

  // ════════════════════════════════════════════════════════════════
  // 9. LRCLIB SYNCED LYRICS ENGINE
  // ════════════════════════════════════════════════════════════════
  async function fetchLyrics(trackName, artistName, duration) {
    if (!UI.lyricsScrollBox) return;
    UI.lyricsScrollBox.innerHTML = '<div class="lyrics-line-active">Searching lyrics...</div>';
    State.lyricsLines = [];

    try {
      const cleanTitle = trackName.replace(/\(.*?\)|\[.*?\]|-.*$/g, '').trim();
      const cleanArtist = artistName.replace(/,.*$/, '').trim();
      const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}&duration=${Math.round(duration || 210)}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data.syncedLyrics) {
          parseSyncedLyrics(data.syncedLyrics);
          renderLyricsLines();
          return;
        } else if (data.plainLyrics) {
          renderPlainLyrics(data.plainLyrics);
          return;
        }
      }
    } catch (e) {
      console.log('Lyrics lookup fallback:', e);
    }

    UI.lyricsScrollBox.innerHTML = `<div class="lyrics-line-active">${trackName}</div><div class="lyrics-line-secondary">${artistName}</div>`;
  }

  function parseSyncedLyrics(lrcText) {
    const lines = lrcText.split('\n');
    const parsed = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0').slice(0, 3), 10);
        const time = min * 60 + sec + ms / 1000;
        const text = line.replace(timeRegex, '').trim();
        if (text) parsed.push({ time, text });
      }
    }
    State.lyricsLines = parsed;
  }

  function renderLyricsLines() {
    if (!UI.lyricsScrollBox) return;
    UI.lyricsScrollBox.innerHTML = State.lyricsLines
      .map((l, i) => `<div class="lyrics-line focusable" id="lyric-${i}" data-time="${l.time}" tabindex="0">${l.text}</div>`)
      .join('');
  }

  function renderPlainLyrics(plainText) {
    if (!UI.lyricsScrollBox) return;
    UI.lyricsScrollBox.innerHTML = plainText.split('\n')
      .filter(l => l.trim().length > 0)
      .map(l => `<div class="lyrics-line">${l}</div>`)
      .join('');
  }

  function syncLyricsWithTime(currentTime) {
    if (!State.lyricsLines || State.lyricsLines.length === 0 || !UI.lyricsScrollBox) return;

    let activeIndex = -1;
    for (let i = 0; i < State.lyricsLines.length; i++) {
      if (currentTime >= State.lyricsLines[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== -1) {
      const allLines = UI.lyricsScrollBox.querySelectorAll('.lyrics-line');
      allLines.forEach((el, idx) => {
        if (idx === activeIndex) {
          el.classList.add('lyrics-line-active');
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          el.classList.remove('lyrics-line-active');
        }
      });
    }
  }

  // ════════════════════════════════════════════════════════════════
  // 10. RENDERING HOME FEED (1:1 AMOLED Grid from user_ss.jpg)
  // ════════════════════════════════════════════════════════════════
  function renderHomeFeed() {
    // 1. Quick Picks: 4 rows per column horizontal grid
    if (UI.quickPicksContainer) {
      const tracks = INITIAL_TRACKS;
      let colsHtml = '';
      for (let i = 0; i < tracks.length; i += 4) {
        const colSlice = tracks.slice(i, i + 4);
        colsHtml += '<div class="quick-picks-col">';
        colSlice.forEach((t) => {
          colsHtml += `
            <div class="quick-pick-item focusable" data-id="${t.id}" tabindex="0">
              <img src="${t.thumbnail}" class="quick-pick-thumb" alt="${t.title}" loading="lazy">
              <div class="quick-pick-info">
                <div class="quick-pick-title">${t.title}</div>
                <div class="quick-pick-artist">${t.artist}</div>
              </div>
              <button class="quick-pick-more-btn" title="More">⋮</button>
            </div>
          `;
        });
        colsHtml += '</div>';
      }
      UI.quickPicksContainer.innerHTML = colsHtml;

      // Attach click handlers
      UI.quickPicksContainer.querySelectorAll('.quick-pick-item').forEach(item => {
        item.addEventListener('click', () => {
          const id = item.getAttribute('data-id');
          const found = INITIAL_TRACKS.find(s => s.id === id);
          if (found) playTrack(found, INITIAL_TRACKS);
        });
      });
    }

    // 2. Listen Again & Stations (Cards)
    function renderCardStrip(container, items) {
      if (!container) return;
      container.innerHTML = items.map(item => `
        <div class="music-card focusable" data-id="${item.id}" tabindex="0">
          <div class="music-card-img-wrap">
            <img src="${item.thumbnail}" class="music-card-img" alt="${item.title}" loading="lazy">
            <div class="music-card-play-hover">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="music-card-title">${item.title}</div>
          <div class="music-card-subtitle">${item.artist}</div>
        </div>
      `).join('');

      container.querySelectorAll('.music-card').forEach(card => {
        card.addEventListener('click', () => {
          const id = card.getAttribute('data-id');
          const found = items.find(s => s.id === id);
          if (found) playTrack(found, items);
        });
      });
    }

    renderCardStrip(UI.listenAgainContainer, INITIAL_TRACKS.slice(0, 6));
    renderCardStrip(UI.listenTogetherContainer, INITIAL_TRACKS.slice(4, 10));
    renderCardStrip(UI.trendingContainer, INITIAL_TRACKS);
  }

  // ════════════════════════════════════════════════════════════════
  // 11. SEARCH VIEW & ON-SCREEN TV KEYBOARD
  // ════════════════════════════════════════════════════════════════
  function initSearch() {
    if (UI.searchInput) {
      UI.searchInput.addEventListener('input', (e) => {
        State.searchQuery = e.target.value;
        debounceSearch(State.searchQuery);
      });
    }

    if (UI.searchClearBtn) {
      UI.searchClearBtn.addEventListener('click', () => {
        if (UI.searchInput) UI.searchInput.value = '';
        State.searchQuery = '';
        if (UI.searchResultsContainer) UI.searchResultsContainer.innerHTML = '';
      });
    }

    // Virtual Keyboard Keys Click Handling
    if (UI.virtualKeyboard) {
      UI.virtualKeyboard.querySelectorAll('.tv-key').forEach(key => {
        key.addEventListener('click', () => {
          const val = key.getAttribute('data-key');
          if (val === 'DEL') {
            State.searchQuery = State.searchQuery.slice(0, -1);
          } else if (val === 'SPACE') {
            State.searchQuery += ' ';
          } else if (val === 'CLEAR') {
            State.searchQuery = '';
          } else {
            State.searchQuery += val;
          }
          if (UI.searchInput) UI.searchInput.value = State.searchQuery;
          debounceSearch(State.searchQuery);
        });
      });
    }
  }

  function debounceSearch(query) {
    clearTimeout(State.searchDebounceTimer);
    if (!query.trim()) {
      if (UI.searchResultsContainer) UI.searchResultsContainer.innerHTML = '';
      return;
    }
    State.searchDebounceTimer = setTimeout(() => {
      performSearch(query.trim());
    }, 400);
  }

  async function performSearch(query) {
    if (!UI.searchResultsContainer) return;
    UI.searchResultsContainer.innerHTML = '<div class="loading-shimmer" style="padding: 24px;">Searching AyushMuzic catalog...</div>';

    const host = (window.location && window.location.origin && window.location.origin.startsWith('http'))
      ? window.location.origin
      : 'http://localhost:8080';

    let results = [];

    // 1. Try Dev Server search endpoint
    try {
      const res = await fetch(`${host}/api/search?q=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          results = data.results;
        }
      }
    } catch (e) {
      console.log('Dev search error, trying cloud Saavn fallback:', e);
    }

    // 2. Fallback to Cloud Saavn Search API
    if (results.length === 0) {
      try {
        const sRes = await fetch(`https://jiosaavn-api-2.vercel.app/search/songs?query=${encodeURIComponent(query)}`, { signal: AbortSignal.timeout(5000) });
        if (sRes.ok) {
          const sData = await sRes.json();
          const items = sData.results || (sData.data && sData.data.results) || [];
          results = items.map(it => {
            const dls = it.downloadUrl || [];
            const bestLink = dls.length > 0 ? dls[dls.length - 1].link : null;
            const imgs = it.image || [];
            const cover = imgs.length > 0 ? imgs[imgs.length - 1].url : 'assets/starboy_square.jpg';
            return {
              id: it.id,
              title: it.name,
              artist: it.primaryArtists || it.artist || 'AyushMuzic',
              duration: parseInt(it.duration, 10) || 210,
              thumbnail: cover,
              streamUrl: bestLink
            };
          });
        }
      } catch (e) {
        console.log('Saavn search fallback error:', e);
      }
    }

    if (results.length === 0) {
      UI.searchResultsContainer.innerHTML = `<div style="padding: 30px; color: var(--text-secondary); text-align: center;">No results found for "${query}"</div>`;
      return;
    }

    // Render Results Grid
    UI.searchResultsContainer.innerHTML = results.map(item => `
      <div class="search-result-item focusable" data-id="${item.id}" tabindex="0">
        <img src="${item.thumbnail}" class="search-result-thumb" alt="${item.title}" loading="lazy">
        <div class="search-result-meta">
          <div class="search-result-title">${item.title}</div>
          <div class="search-result-artist">${item.artist} • ${formatTime(item.duration)}</div>
        </div>
        <button class="search-result-play-btn" title="Play">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>
    `).join('');

    UI.searchResultsContainer.querySelectorAll('.search-result-item').forEach((row, idx) => {
      row.addEventListener('click', () => {
        playTrack(results[idx], results);
      });
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 12. SCREEN NAVIGATION & MODAL MANAGEMENT
  // ════════════════════════════════════════════════════════════════
  function switchScreen(screenId) {
    State.activeScreen = screenId;
    [UI.viewHome, UI.viewSearch, UI.viewLibrary].forEach(view => {
      if (view) view.classList.remove('active');
    });

    [UI.navHome, UI.navSearch, UI.navLibrary].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (screenId === 'viewHome') {
      if (UI.viewHome) UI.viewHome.classList.add('active');
      if (UI.navHome) UI.navHome.classList.add('active');
    } else if (screenId === 'viewSearch') {
      if (UI.viewSearch) UI.viewSearch.classList.add('active');
      if (UI.navSearch) UI.navSearch.classList.add('active');
      setTimeout(() => { if (UI.searchInput) UI.searchInput.focus(); }, 100);
    } else if (screenId === 'viewLibrary') {
      if (UI.viewLibrary) UI.viewLibrary.classList.add('active');
      if (UI.navLibrary) UI.navLibrary.classList.add('active');
    }
  }

  function openNowPlaying() {
    State.nowPlayingOpen = true;
    if (UI.nowPlayingScreen) UI.nowPlayingScreen.classList.remove('hidden');
    if (UI.npPlayBtn) UI.npPlayBtn.focus();
  }

  function closeNowPlaying() {
    State.nowPlayingOpen = false;
    if (UI.nowPlayingScreen) UI.nowPlayingScreen.classList.add('hidden');
    if (UI.miniPlayer) UI.miniPlayer.focus();
  }

  // ════════════════════════════════════════════════════════════════
  // 13. TV D-PAD & HARDWARE REMOTE CONTROLS
  // ════════════════════════════════════════════════════════════════
  function initRemoteNavigation() {
    window.addEventListener('keydown', (e) => {
      // Hardware Media Keys
      if (e.key === 'MediaPlayPause' || e.keyCode === 10252) {
        togglePlayPause();
        e.preventDefault();
        return;
      }
      if (e.key === 'MediaPlay' || e.keyCode === 415) {
        if (audioEl.paused) togglePlayPause();
        e.preventDefault();
        return;
      }
      if (e.key === 'MediaPause' || e.keyCode === 19) {
        if (!audioEl.paused) togglePlayPause();
        e.preventDefault();
        return;
      }
      if (e.key === 'MediaTrackNext' || e.keyCode === 10253) {
        playNext();
        e.preventDefault();
        return;
      }
      if (e.key === 'MediaTrackPrevious' || e.keyCode === 10254) {
        playPrevious();
        e.preventDefault();
        return;
      }

      // Back Key (Tizen / Browser Escape)
      if (e.key === 'Escape' || e.key === 'Back' || e.keyCode === 10009) {
        if (State.nowPlayingOpen) {
          closeNowPlaying();
          e.preventDefault();
          return;
        }
        if (UI.settingsModal && !UI.settingsModal.classList.contains('hidden')) {
          UI.settingsModal.classList.add('hidden');
          e.preventDefault();
          return;
        }
        if (UI.addModal && !UI.addModal.classList.contains('hidden')) {
          UI.addModal.classList.add('hidden');
          e.preventDefault();
          return;
        }
        if (State.activeScreen !== 'viewHome') {
          switchScreen('viewHome');
          e.preventDefault();
          return;
        }
      }
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 14. EVENT HANDLERS & BOOTSTRAP
  // ════════════════════════════════════════════════════════════════
  function initEventListeners() {
    // Mini player clicks
    if (UI.miniPlayBtn) {
      UI.miniPlayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePlayPause();
      });
    }
    if (UI.miniNextBtn) {
      UI.miniNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playNext();
      });
    }
    if (UI.miniHeartBtn) {
      UI.miniHeartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = State.currentSong.id || State.currentSong.title;
        if (State.favorites.has(key)) State.favorites.delete(key);
        else State.favorites.add(key);
        updateFaveUI(State.favorites.has(key));
      });
    }
    if (UI.miniPlayer) {
      UI.miniPlayer.addEventListener('click', openNowPlaying);
    }

    // Now Playing controls
    if (UI.npCloseBtn) UI.npCloseBtn.addEventListener('click', closeNowPlaying);
    if (UI.npPlayBtn) UI.npPlayBtn.addEventListener('click', togglePlayPause);
    if (UI.npNextBtn) UI.npNextBtn.addEventListener('click', playNext);
    if (UI.npPrevBtn) UI.npPrevBtn.addEventListener('click', playPrevious);
    if (UI.npSeekSlider) {
      UI.npSeekSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (State.duration > 0) {
          const targetSec = (val / 100) * State.duration;
          seekTo(targetSec);
        }
      });
    }
    if (UI.npHeartBtn) {
      UI.npHeartBtn.addEventListener('click', () => {
        const key = State.currentSong.id || State.currentSong.title;
        if (State.favorites.has(key)) State.favorites.delete(key);
        else State.favorites.add(key);
        updateFaveUI(State.favorites.has(key));
      });
    }

    // Bottom Navigation
    if (UI.navHome) UI.navHome.addEventListener('click', () => switchScreen('viewHome'));
    if (UI.navSearch) UI.navSearch.addEventListener('click', () => switchScreen('viewSearch'));
    if (UI.navLibrary) UI.navLibrary.addEventListener('click', () => switchScreen('viewLibrary'));

    // Modals
    if (UI.headerSettingsBtn) {
      UI.headerSettingsBtn.addEventListener('click', () => {
        if (UI.settingsModal) UI.settingsModal.classList.remove('hidden');
      });
    }
    if (UI.closeSettingsBtn) {
      UI.closeSettingsBtn.addEventListener('click', () => {
        if (UI.settingsModal) UI.settingsModal.classList.add('hidden');
      });
    }
    if (UI.headerAddBtn) {
      UI.headerAddBtn.addEventListener('click', () => {
        if (UI.addModal) UI.addModal.classList.remove('hidden');
      });
    }
    if (UI.closeAddBtn) {
      UI.closeAddBtn.addEventListener('click', () => {
        if (UI.addModal) UI.addModal.classList.add('hidden');
      });
    }
  }

  // Bootstrap Application
  document.addEventListener('DOMContentLoaded', () => {
    renderHomeFeed();
    initSearch();
    initRemoteNavigation();
    initEventListeners();

    // Prepare default track
    updateTrackMetadataUI(State.currentSong);
    console.log('AyushMuzic Pure Native Audio Engine initialized.');
  });

})();
