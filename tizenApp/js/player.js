/**
 * AyushMuzic Tizen Smart TV — Audio Player & Queue Engine
 * Dual-Engine: Official YouTube HTML5 Embed (Unblockable & Never 403) + HTML5 Audio Fallback
 * Full Apple Music & Material 3 Expressive UI synchronization, live lyrics, and D-Pad remote control.
 */

window.Player = {
  queue: [],
  queueIndex: 0,
  currentSong: null,
  isPlaying: false,
  isShuffle: false,
  repeatMode: 0, // 0 = off, 1 = repeat all, 2 = repeat one
  volume: 0.9,
  audio: null,
  sponsorSegments: [],
  ytPlayer: null,
  ytReady: false,
  progressTimer: null,

  init() {
    Player.audio = document.getElementById('audioElement');
    if (!Player.audio) {
      Player.audio = new Audio();
      Player.audio.id = 'audioElement';
      document.body.appendChild(Player.audio);
    }
    Player.audio.volume = Player.volume;

    // HTML5 Audio listeners (fallback)
    Player.audio.addEventListener('timeupdate', Player.onTimeUpdate);
    Player.audio.addEventListener('ended', Player.onEnded);
    Player.audio.addEventListener('play', () => Player.setPlayState(true));
    Player.audio.addEventListener('pause', () => Player.setPlayState(false));

    // Initialize YouTube Unblockable Embedded Player
    Player.initYouTubeEngine();

    // Mini Player Controls
    document.getElementById('mpPlayPause')?.addEventListener('click', Player.togglePlay);
    document.getElementById('mpNext')?.addEventListener('click', Player.next);
    document.getElementById('mpPrev')?.addEventListener('click', Player.prev);
    document.getElementById('mpShuffle')?.addEventListener('click', Player.toggleShuffle);
    document.getElementById('mpRepeat')?.addEventListener('click', Player.cycleRepeat);
    document.getElementById('mpFaveBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (Player.currentSong) Library.toggleFavorite(Player.currentSong);
    });
    document.getElementById('mpLeftSlot')?.addEventListener('click', Player.openNowPlaying);

    // Seekbars
    const mpSeek = document.getElementById('mpSeekBar');
    const npSeek = document.getElementById('npSeekBar');
    const handleSeek = (e) => {
      const pct = parseFloat(e.target.value);
      Player.seekPercent(pct);
    };
    mpSeek?.addEventListener('input', handleSeek);
    npSeek?.addEventListener('input', handleSeek);

    // Volume Sliders
    const mpVol = document.getElementById('mpVolume');
    const npVol = document.getElementById('npVolume');
    const handleVol = (e) => {
      const vol = parseFloat(e.target.value) / 100;
      Player.setVolume(vol);
    };
    mpVol?.addEventListener('input', handleVol);
    npVol?.addEventListener('input', handleVol);

    // Now Playing Controls
    document.getElementById('npPlayPause')?.addEventListener('click', Player.togglePlay);
    document.getElementById('npNext')?.addEventListener('click', Player.next);
    document.getElementById('npPrev')?.addEventListener('click', Player.prev);
    document.getElementById('npShuffle')?.addEventListener('click', Player.toggleShuffle);
    document.getElementById('npRepeat')?.addEventListener('click', Player.cycleRepeat);
    document.getElementById('npFaveBtn')?.addEventListener('click', () => {
      if (Player.currentSong) Library.toggleFavorite(Player.currentSong);
    });

    // View Toggles
    document.getElementById('mpExpandBtn')?.addEventListener('click', Player.openNowPlaying);
    document.getElementById('closeNowPlaying')?.addEventListener('click', Player.closeNowPlaying);
    document.getElementById('mpLyricsBtn')?.addEventListener('click', () => {
      Player.openNowPlaying();
      Lyrics.toggle();
    });
    document.getElementById('npLyricsBtn')?.addEventListener('click', Lyrics.toggle);
    document.getElementById('closeLyricsBtn')?.addEventListener('click', () => {
      document.getElementById('npLyricsPanel')?.classList.add('hidden');
    });

    document.getElementById('mpQueueBtn')?.addEventListener('click', () => {
      Player.openNowPlaying();
      Player.toggleQueuePanel();
    });
    document.getElementById('npQueueBtn')?.addEventListener('click', Player.toggleQueuePanel);
    document.getElementById('closeQueueBtn')?.addEventListener('click', () => {
      document.getElementById('npQueuePanel')?.classList.add('hidden');
    });

    document.getElementById('mpEqBtn')?.addEventListener('click', () => {
      Player.openNowPlaying();
      Equalizer.toggle();
    });
    document.getElementById('npEqBtn')?.addEventListener('click', Equalizer.toggle);
    document.getElementById('quickEqBtn')?.addEventListener('click', () => {
      Player.openNowPlaying();
      Equalizer.toggle();
    });
    document.getElementById('closeEqBtn')?.addEventListener('click', () => {
      document.getElementById('npEqPanel')?.classList.add('hidden');
    });

    console.log('✓ AyushMuzic Player initialized');
  },

  initYouTubeEngine() {
    let container = document.getElementById('ytPlayerContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'ytPlayerContainer';
      container.style.cssText = 'position:fixed; bottom:-2000px; left:-2000px; width:200px; height:200px; opacity:0; pointer-events:none; z-index:-1;';
      document.body.appendChild(container);
    }

    // Global callback for YouTube API
    window.onYouTubeIframeAPIReady = function() {
      try {
        Player.ytPlayer = new YT.Player('ytPlayerContainer', {
          height: '200',
          width: '200',
          playerVars: {
            'autoplay': 1,
            'controls': 0,
            'disablekb': 1,
            'fs': 0,
            'playsinline': 1,
            'rel': 0,
            'origin': window.location.origin || 'http://localhost'
          },
          events: {
            'onReady': () => {
              Player.ytReady = true;
              console.log('✓ YouTube Embedded Audio Engine Ready');
            },
            'onStateChange': (e) => Player.onYTStateChange(e),
            'onError': (err) => console.warn('YouTube Engine Error:', err)
          }
        });
      } catch (e) {
        console.warn('Failed to init YT.Player:', e);
      }
    };

    // Load YouTube Iframe API Script
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }
  },

  onYTStateChange(e) {
    if (!window.YT) return;
    if (e.data === YT.PlayerState.PLAYING) {
      Player.setPlayState(true);
      Player.startProgressTimer();
    } else if (e.data === YT.PlayerState.PAUSED) {
      Player.setPlayState(false);
      Player.stopProgressTimer();
    } else if (e.data === YT.PlayerState.ENDED) {
      Player.setPlayState(false);
      Player.stopProgressTimer();
      Player.onEnded();
    }
  },

  startProgressTimer() {
    Player.stopProgressTimer();
    Player.progressTimer = setInterval(() => {
      if (Player.ytPlayer && typeof Player.ytPlayer.getCurrentTime === 'function') {
        const cur = Player.ytPlayer.getCurrentTime() || 0;
        const dur = Player.ytPlayer.getDuration() || (Player.currentSong ? Player.currentSong.duration : 0) || 0;
        Player.updateProgressUI(cur, dur);
      }
    }, 250);
  },

  stopProgressTimer() {
    if (Player.progressTimer) {
      clearInterval(Player.progressTimer);
      Player.progressTimer = null;
    }
  },

  async loadSong(song, autoPlay = true) {
    if (!song) return;
    Player.currentSong = song;

    // Show mini player
    const mp = document.getElementById('miniPlayer');
    if (mp) mp.style.display = '';

    const artistStr = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || '');
    const thumb = song.thumbnail || 'assets/logo.png';

    // Update Mini Player UI
    const mpTitle = document.getElementById('mpTitle');
    const mpArtist = document.getElementById('mpArtist');
    const mpArtwork = document.getElementById('mpArtwork');
    if (mpTitle) mpTitle.textContent = song.title;
    if (mpArtist) mpArtist.textContent = artistStr;
    if (mpArtwork) mpArtwork.src = thumb;

    // Update Now Playing UI
    const npTitle = document.getElementById('npTitle');
    const npArtist = document.getElementById('npArtist');
    const npArtwork = document.getElementById('npArtwork');
    if (npTitle) npTitle.textContent = song.title;
    if (npArtist) npArtist.textContent = artistStr;
    if (npArtwork) npArtwork.src = thumb;

    // Check Liked Status
    const isFav = await Library.isFavorite(song.videoId || song.id);
    Player.updateFavoriteButtons(isFav);

    // Update dynamic mesh backdrop
    Player.updateDynamicMesh(thumb);

    // Load Synced Lyrics
    Lyrics.loadForSong(song);

    // Record Play
    Library.recordPlay(song);
    Analytics.trackPlay(song);

    // PLAY AUDIO VIA UNBLOCKABLE YOUTUBE ENGINE
    const vId = song.videoId || song.id || '';

    if (Player.ytPlayer && typeof Player.ytPlayer.loadVideoById === 'function') {
      if (vId.startsWith('yt_')) {
        const searchPhrase = decodeURIComponent(vId.replace('yt_', ''));
        console.log('[Player] Playing search query via YouTube Engine:', searchPhrase);
        Player.ytPlayer.loadPlaylist({
          listType: 'search',
          list: searchPhrase
        });
      } else {
        console.log('[Player] Playing videoId via YouTube Engine:', vId);
        Player.ytPlayer.loadVideoById(vId);
      }
      Player.setPlayState(true);
      Player.startProgressTimer();
    } else {
      // Fallback to HTML5 audio element
      Player.audio.src = `/api/stream?videoId=${vId}`;
      if (autoPlay) Player.play();
    }

    showToast(`Streaming "${song.title}"`);
  },

  play() {
    if (Player.ytPlayer && typeof Player.ytPlayer.playVideo === 'function') {
      Player.ytPlayer.playVideo();
      Player.setPlayState(true);
      Player.startProgressTimer();
    } else if (Player.audio) {
      Player.audio.play().then(() => Player.setPlayState(true)).catch(() => {});
    }
  },

  pause() {
    if (Player.ytPlayer && typeof Player.ytPlayer.pauseVideo === 'function') {
      Player.ytPlayer.pauseVideo();
      Player.setPlayState(false);
      Player.stopProgressTimer();
    } else if (Player.audio) {
      Player.audio.pause();
      Player.setPlayState(false);
    }
  },

  togglePlay() {
    if (!Player.currentSong && Player.queue.length > 0) {
      Player.loadSong(Player.queue[0], true);
      return;
    }
    if (Player.isPlaying) Player.pause();
    else Player.play();
  },

  setPlayState(isPlaying) {
    Player.isPlaying = isPlaying;
    const mpPlay = document.getElementById('mpPlayPause');
    const npPlay = document.getElementById('npPlayPause');
    const icon = isPlaying ? '⏸' : '▶';
    if (mpPlay) mpPlay.textContent = icon;
    if (npPlay) npPlay.textContent = icon;
  },

  seekPercent(pct) {
    if (Player.ytPlayer && typeof Player.ytPlayer.getDuration === 'function') {
      const dur = Player.ytPlayer.getDuration() || (Player.currentSong ? Player.currentSong.duration : 0);
      const target = (pct / 100) * dur;
      Player.ytPlayer.seekTo(target, true);
    } else if (Player.audio && Player.audio.duration) {
      Player.audio.currentTime = (pct / 100) * Player.audio.duration;
    }
  },

  seek(seconds) {
    if (Player.ytPlayer && typeof Player.ytPlayer.seekTo === 'function') {
      Player.ytPlayer.seekTo(seconds, true);
    } else if (Player.audio) {
      Player.audio.currentTime = seconds;
    }
  },

  updateProgressUI(cur, dur) {
    const pct = dur ? (cur / dur) * 100 : 0;
    const mpSeek = document.getElementById('mpSeekBar');
    const npSeek = document.getElementById('npSeekBar');
    if (mpSeek) mpSeek.value = pct;
    if (npSeek) npSeek.value = pct;

    const formattedCur = formatTime(cur);
    const formattedDur = formatTime(dur);
    document.getElementById('mpCurrentTime').textContent = formattedCur;
    document.getElementById('npCurrentTime').textContent = formattedCur;
    if (dur) {
      document.getElementById('mpDuration').textContent = formattedDur;
      document.getElementById('npDuration').textContent = formattedDur;
    }

    // Synced Lyrics Highlight update
    Lyrics.updateHighlight(cur);
  },

  onTimeUpdate() {
    if (Player.audio) {
      Player.updateProgressUI(Player.audio.currentTime, Player.audio.duration);
    }
  },

  onEnded() {
    if (Player.repeatMode === 2) {
      Player.seek(0);
      Player.play();
    } else {
      Player.next();
    }
  },

  next() {
    if (!Player.queue.length) return;
    if (Player.isShuffle) {
      let nextIdx = Math.floor(Math.random() * Player.queue.length);
      if (nextIdx === Player.queueIndex && Player.queue.length > 1) {
        nextIdx = (nextIdx + 1) % Player.queue.length;
      }
      Player.queueIndex = nextIdx;
    } else {
      Player.queueIndex++;
      if (Player.queueIndex >= Player.queue.length) {
        if (Player.repeatMode === 1) Player.queueIndex = 0;
        else {
          Player.queueIndex = Player.queue.length - 1;
          Player.pause();
          return;
        }
      }
    }
    Player.loadSong(Player.queue[Player.queueIndex], true);
    Player.renderQueue();
  },

  prev() {
    let cur = 0;
    if (Player.ytPlayer && typeof Player.ytPlayer.getCurrentTime === 'function') {
      cur = Player.ytPlayer.getCurrentTime();
    } else if (Player.audio) {
      cur = Player.audio.currentTime;
    }

    if (cur > 4) {
      Player.seek(0);
      return;
    }

    if (!Player.queue.length) return;
    Player.queueIndex--;
    if (Player.queueIndex < 0) {
      Player.queueIndex = Player.repeatMode === 1 ? Player.queue.length - 1 : 0;
    }
    Player.loadSong(Player.queue[Player.queueIndex], true);
    Player.renderQueue();
  },

  setVolume(vol) {
    Player.volume = Math.max(0, Math.min(1, vol));
    if (Player.ytPlayer && typeof Player.ytPlayer.setVolume === 'function') {
      Player.ytPlayer.setVolume(Player.volume * 100);
    }
    if (Player.audio) Player.audio.volume = Player.volume;

    const pct = Player.volume * 100;
    const mpVol = document.getElementById('mpVolume');
    const npVol = document.getElementById('npVolume');
    if (mpVol) mpVol.value = pct;
    if (npVol) npVol.value = pct;
  },

  setQueue(songs, startIndex = 0) {
    if (!Array.isArray(songs) || !songs.length) return;
    Player.queue = [...songs];
    Player.queueIndex = startIndex;
    Player.loadSong(Player.queue[startIndex], true);
    Player.renderQueue();
  },

  toggleShuffle() {
    Player.isShuffle = !Player.isShuffle;
    document.getElementById('mpShuffle')?.classList.toggle('active', Player.isShuffle);
    document.getElementById('npShuffle')?.classList.toggle('active', Player.isShuffle);
    showToast(Player.isShuffle ? 'Shuffle ON' : 'Shuffle OFF');
  },

  cycleRepeat() {
    Player.repeatMode = (Player.repeatMode + 1) % 3;
    const mpRep = document.getElementById('mpRepeat');
    const npRep = document.getElementById('npRepeat');
    const labels = ['Repeat OFF', 'Repeat All', 'Repeat Once'];
    const icons = ['🔁', '🔁', '🔂'];

    if (mpRep) {
      mpRep.textContent = icons[Player.repeatMode];
      mpRep.classList.toggle('active', Player.repeatMode > 0);
    }
    if (npRep) {
      npRep.textContent = icons[Player.repeatMode];
      npRep.classList.toggle('active', Player.repeatMode > 0);
    }
    showToast(labels[Player.repeatMode]);
  },

  updateFavoriteButtons(isFav) {
    const icon = isFav ? '♥' : '♡';
    const color = isFav ? 'var(--accent-pink)' : '';
    document.querySelectorAll('#mpFaveBtn, #npFaveBtn').forEach(btn => {
      btn.textContent = icon;
      btn.style.color = color;
    });
  },

  updateDynamicMesh(thumbUrl) {
    if (!thumbUrl) return;
    const backdrop = document.getElementById('npBackdrop');
    if (backdrop) {
      backdrop.style.backgroundImage = `radial-gradient(circle at 30% 25%, rgba(255, 45, 85, 0.45) 0%, transparent 65%), radial-gradient(circle at 70% 75%, rgba(138, 43, 226, 0.45) 0%, transparent 65%), url('${thumbUrl}')`;
      backdrop.style.backgroundSize = 'cover';
      backdrop.style.backgroundPosition = 'center';
    }
  },

  openNowPlaying() {
    if (!Player.currentSong && Player.queue.length === 0) return;
    const overlay = document.getElementById('nowPlayingOverlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      document.body.classList.add('no-scroll');
      if (window.TVNavigation) {
        setTimeout(() => {
          const btn = document.getElementById('npPlayPause');
          if (btn) TVNavigation.setFocus(btn);
        }, 100);
      }
    }
  },

  closeNowPlaying() {
    const overlay = document.getElementById('nowPlayingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      document.body.classList.remove('no-scroll');
      if (window.TVNavigation) {
        setTimeout(() => {
          const btn = document.getElementById('mpPlayPause');
          if (btn) TVNavigation.setFocus(btn);
        }, 100);
      }
    }
  },

  toggleQueuePanel() {
    const panel = document.getElementById('npQueuePanel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) Player.renderQueue();
    }
  },

  renderQueue() {
    const list = document.getElementById('queueList');
    if (!list) return;

    if (!Player.queue.length) {
      list.innerHTML = '<div class="empty-hint">Queue is empty</div>';
      return;
    }

    list.innerHTML = Player.queue.map((s, i) => {
      const isCur = i === Player.queueIndex;
      const art = Array.isArray(s.artists) ? s.artists.join(', ') : (s.artist || '');
      const thumb = s.thumbnail || 'assets/logo.png';
      return `
        <div class="queue-item focusable ${isCur ? 'active' : ''}" onclick="Player.queueIndex=${i}; Player.loadSong(Player.queue[${i}], true); Player.renderQueue();">
          <span class="queue-idx">${isCur ? '▶' : i + 1}</span>
          <img src="${thumb}" class="queue-thumb" alt="">
          <div class="queue-meta">
            <span class="queue-title">${s.title}</span>
            <span class="queue-artist">${art}</span>
          </div>
        </div>
      `;
    }).join('');
  }
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function showToast(msg) {
  let toast = document.getElementById('appToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = 'app-toast-box';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
