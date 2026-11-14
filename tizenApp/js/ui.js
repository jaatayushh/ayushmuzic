/**
 * AyushMuzic Web — UI & Component Engine
 * Handles rendering of Recently Played, Most Played, Quick Picks,
 * Profile Switching (Guest/Ayush/Rohan), Mood filter chips, and search/artist views.
 */

window.UI = {
  currentMood: '',

  async initProfiles() {
    const pillBtn = document.getElementById('profilePillBtn');
    const dropdown = document.getElementById('profileDropdown');
    const topAvatar = document.getElementById('topAvatar');
    const topName = document.getElementById('topProfileName');
    const listEl = document.getElementById('profileListItems');
    const addBtn = document.getElementById('addNewProfileBtn');

    // Update Top Pill
    if (topAvatar) topAvatar.textContent = DB.activeUserName.charAt(0).toUpperCase();
    if (topName) topName.textContent = DB.activeUserName;

    // Toggle dropdown
    pillBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dropdown?.classList.add('hidden');
    });

    dropdown?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Render profile items in dropdown
    UI.renderProfileDropdown();

    // Add new profile button
    addBtn?.addEventListener('click', () => {
      const name = prompt('Enter profile name:');
      if (name && name.trim()) {
        const id = name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        DB.profiles.push({ id, name: name.trim() });
        UI.switchProfile(id, name.trim());
      }
    });

    // History button in topbar
    document.getElementById('historyTopBtn')?.addEventListener('click', () => {
      Router.navigate('library');
      Library.currentTab = 'history';
      Library.render();
    });
  },

  renderProfileDropdown() {
    const listEl = document.getElementById('profileListItems');
    if (!listEl) return;

    listEl.innerHTML = DB.profiles.map(p => `
      <div class="profile-item ${p.id === DB.activeUser ? 'active' : ''}" onclick="UI.switchProfile('${p.id}', '${p.name}')">
        <span class="profile-item-avatar">${p.name.charAt(0).toUpperCase()}</span>
        <span class="profile-item-name">${p.name}</span>
      </div>
    `).join('');
  },

  async switchProfile(userId, userName) {
    DB.setActiveUser(userId, userName);

    // Update Top bar UI
    document.getElementById('topAvatar').textContent = userName.charAt(0).toUpperCase();
    document.getElementById('topProfileName').textContent = userName;
    document.getElementById('profileDropdown')?.classList.add('hidden');

    UI.renderProfileDropdown();

    // Update Home & Analytics user labels
    document.getElementById('activeUserLabel').textContent = userName;
    document.getElementById('recentUserBadge').textContent = userName;
    document.getElementById('mostPlayedUserBadge').textContent = userName;
    const recBadge = document.getElementById('recommendedUserBadge');
    if (recBadge) recBadge.textContent = userName;

    // Refresh Profile-Specific Music Rows
    await UI.refreshUserRows();
    await Library.renderSidebar();
    await Analytics.render();

    showToast(`Switched profile to ${userName}`);
  },

  async refreshUserRows() {
    const userBadge = document.getElementById('recentUserBadge');
    const mostBadge = document.getElementById('mostPlayedUserBadge');
    const recBadge = document.getElementById('recommendedUserBadge');
    if (userBadge) userBadge.textContent = DB.activeUserName;
    if (mostBadge) mostBadge.textContent = DB.activeUserName;
    if (recBadge) recBadge.textContent = DB.activeUserName;

    // 1. Refresh Recently Played
    const recent = await Library.getRecentlyPlayed();
    const recentEl = document.getElementById('recentlyPlayedCarousel');
    if (recentEl) {
      if (recent.length) {
        recentEl.innerHTML = recent.map((song, i) => UI.renderCarouselCard(song, i, recent)).join('');
      } else {
        recentEl.innerHTML = `<div class="empty-hint">No songs played yet as <strong>${DB.activeUserName}</strong>. Play a track below to start!</div>`;
      }
    }

    // 2. Refresh Most Played
    const most = await Library.getMostPlayed();
    const mostEl = document.getElementById('mostPlayedCarousel');
    if (mostEl) {
      if (most.length) {
        mostEl.innerHTML = most.map((song, i) => UI.renderMostPlayedCard(song, i, most)).join('');
      } else {
        mostEl.innerHTML = `<div class="empty-hint">Stream tracks as <strong>${DB.activeUserName}</strong> to build your top tracks.</div>`;
      }
    }

    // 3. Refresh "Similar to what you played / Recommended"
    const recEl = document.getElementById('recommendedCarousel');
    const recHeadline = document.getElementById('recommendedHeadline');
    if (recEl) {
      try {
        let apiUrl = '/api/related?query=Popular%20Trending%20Songs';
        if (recent.length > 0) {
          const seed = recent[0];
          if (recHeadline) recHeadline.textContent = `Similar to "${seed.title}"`;
          const artist = Array.isArray(seed.artists) ? seed.artists[0] : (seed.artist || '');
          apiUrl = `/api/related?videoId=${seed.videoId}&query=${encodeURIComponent(artist || seed.title)}`;
        } else if (most.length > 0) {
          const seed = most[0];
          if (recHeadline) recHeadline.textContent = `Based on your top pick "${seed.title}"`;
          apiUrl = `/api/related?videoId=${seed.videoId}`;
        } else {
          if (recHeadline) recHeadline.textContent = `Recommended for ${DB.activeUserName}`;
        }

        const res = await fetch(apiUrl);
        const data = await res.json();
        const songs = data.songs || [];
        if (songs.length) {
          recEl.innerHTML = songs.map((s, i) => UI.renderCarouselCard(s, i, songs)).join('');
        } else {
          recEl.innerHTML = `<div class="empty-hint">Stream songs to discover tailor-made recommendations.</div>`;
        }
      } catch (e) {
        recEl.innerHTML = `<div class="empty-hint">Stream songs to discover tailor-made recommendations.</div>`;
      }
    }
  },

  async loadHome(mood = '') {
    UI.currentMood = mood;
    const greeting = document.getElementById('greetingText');
    if (greeting) {
      const h = new Date().getHours();
      greeting.textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    }

    // Update active user label
    document.getElementById('activeUserLabel').textContent = DB.activeUserName;
    document.getElementById('recentUserBadge').textContent = DB.activeUserName;
    document.getElementById('mostPlayedUserBadge').textContent = DB.activeUserName;

    // Refresh profile-specific rows first
    await UI.refreshUserRows();

    // Load Quick Picks from API
    const grid = document.getElementById('quickPicksGrid');
    if (grid) grid.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const url = mood ? `/api/home?mood=${encodeURIComponent(mood)}` : '/api/home';
      const res = await fetch(url);
      const data = await res.json();
      const items = data.sections?.[0]?.items || [];

      if (grid) {
        if (items.length) {
          grid.innerHTML = items.map((song, i) => UI.renderSongCard(song, i, items)).join('');
        } else {
          grid.innerHTML = '<p style="color:var(--text-muted); padding:20px;">No tracks found for this mood.</p>';
        }
      }

      // Trending Carousel
      const trendingEl = document.getElementById('newReleasesCarousel');
      if (trendingEl && !trendingEl.children.length) {
        const tRes = await fetch('/api/home?mood=Trending');
        const tData = await tRes.json();
        const tItems = tData.sections?.[0]?.items || [];
        trendingEl.innerHTML = tItems.map((s, i) => UI.renderCarouselCard(s, i, tItems)).join('');
      }
    } catch (err) {
      console.error('Home load error:', err);
      if (grid) grid.innerHTML = '<p style="color:var(--text-muted)">Failed to load quick picks.</p>';
    }
  },

  renderSongCard(song, index, queue) {
    const queueJson = JSON.stringify(queue).replace(/"/g, '&quot;');
    const artist = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || '');

    return `
      <div class="song-card" onclick="Player.setQueue(${queueJson}, ${index})">
        <div class="song-card-art">
          <img src="${song.thumbnail || '/assets/logo.png'}" alt="${song.title}" loading="lazy" onerror="this.src='/assets/logo.png'">
          <button class="play-overlay" title="Play">▶</button>
        </div>
        <div class="song-card-title">${song.title}</div>
        <div class="song-card-artist">${artist}</div>
      </div>
    `;
  },

  renderCarouselCard(item, index, queue) {
    const queueJson = JSON.stringify(queue || [item]).replace(/"/g, '&quot;');
    const artist = Array.isArray(item.artists) ? item.artists.join(', ') : (item.artist || '');

    return `
      <div class="carousel-card" onclick="Player.setQueue(${queueJson}, ${index || 0})">
        <img class="carousel-thumb" src="${item.thumbnail || '/assets/logo.png'}" alt="${item.title}" loading="lazy" onerror="this.src='/assets/logo.png'">
        <div class="carousel-title">${item.title}</div>
        <div class="carousel-sub">${artist}</div>
      </div>
    `;
  },

  renderMostPlayedCard(item, index, queue) {
    const queueJson = JSON.stringify(queue || [item]).replace(/"/g, '&quot;');
    const artist = Array.isArray(item.artists) ? item.artists.join(', ') : (item.artist || '');

    return `
      <div class="carousel-card" onclick="Player.setQueue(${queueJson}, ${index || 0})">
        <span class="play-count-badge">🔥 ${item.playCount} plays</span>
        <img class="carousel-thumb" src="${item.thumbnail || '/assets/logo.png'}" alt="${item.title}" loading="lazy" onerror="this.src='/assets/logo.png'">
        <div class="carousel-title">${item.title}</div>
        <div class="carousel-sub">${artist}</div>
      </div>
    `;
  },

  renderTrackItem(song, index, queue) {
    const queueJson = JSON.stringify(queue).replace(/"/g, '&quot;');
    const songJson = JSON.stringify(song).replace(/"/g, '&quot;');
    const artist = Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || '');
    const isPlaying = Player.currentSong && Player.currentSong.videoId === song.videoId;

    return `
      <div class="track-item ${isPlaying ? 'playing' : ''}" onclick="Player.setQueue(${queueJson}, ${index})">
        <span class="track-num">${index + 1}</span>
        <div class="track-main">
          <img src="${song.thumbnail || '/assets/logo.png'}" onerror="this.src='/assets/logo.png'">
          <div>
            <div class="track-title">${song.title}</div>
            <div class="track-artist">${artist}</div>
          </div>
        </div>
        <span class="track-album">${song.album || ''}</span>
        <div class="track-actions">
          <button class="icon-btn" onclick="event.stopPropagation(); Library.toggleFavorite(${songJson});" title="Like">♡</button>
          <span class="track-duration">${formatTime(song.duration || 180)}</span>
        </div>
      </div>
    `;
  },

  loadSearchCategories() {
    const container = document.getElementById('searchCategories');
    if (!container || container.children.length > 0) return;

    const categories = [
      { name: 'Bollywood Top', emoji: '🎬', color: '#f59e0b' },
      { name: 'Pop Hits', emoji: '🌟', color: '#8b5cf6' },
      { name: 'Hip-Hop & Rap', emoji: '🎤', color: '#ec4899' },
      { name: 'Rock Classics', emoji: '🎸', color: '#ef4444' },
      { name: 'EDM & Dance', emoji: '⚡', color: '#06b6d4' },
      { name: 'Chill & Lo-Fi', emoji: '🌙', color: '#6366f1' },
      { name: 'Workout Power', emoji: '🔥', color: '#10b981' },
      { name: 'Sleep & Ambient', emoji: '💤', color: '#14b8a6' }
    ];

    container.innerHTML = `
      <h2 style="margin-bottom: 16px;">Browse Categories</h2>
      <div class="category-grid">
        ${categories.map(c => `
          <div class="category-tile" style="background: ${c.color}20; border: 1px solid ${c.color}40;"
               onclick="document.getElementById('searchInput').value='${c.name}'; performSearch('${c.name}', 'song');">
            <span class="category-emoji">${c.emoji}</span>
            <span class="category-name">${c.name}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  async loadBrowse() {
    const container = document.getElementById('browseContent');
    if (!container) return;

    const moods = [
      { title: 'Top 50 Global Hits', desc: 'The most streamed tracks globally on YouTube Music', query: 'Top 50 Global hits' },
      { title: 'Late Night Chill', desc: 'Smooth vibes, synthwave, and mellow acoustics', query: 'Chill vibes acoustic' },
      { title: 'Beast Mode Gym', desc: 'High energy beats for intense workouts', query: 'Workout motivation hype' },
      { title: 'Punjabi & Bollywood Hot 50', desc: 'Top party tracks and trending hits', query: 'Top Punjabi Bollywood songs' }
    ];

    container.innerHTML = `
      <div class="song-grid">
        ${moods.map(m => `
          <div class="song-card" onclick="document.getElementById('searchInput').value='${m.query}'; Router.navigate('search'); performSearch('${m.query}', 'song');">
            <div class="song-card-art" style="background:var(--accent-gradient); display:flex; align-items:center; justify-content:center; font-size:36px;">
              ✨
            </div>
            <div class="song-card-title">${m.title}</div>
            <div class="song-card-artist">${m.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async loadArtist(channelId) {
    if (!channelId) return;
    const header = document.getElementById('artistHeader');
    const songs = document.getElementById('artistSongs');
    if (header) header.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const res = await fetch(`/api/artist?channelId=${channelId}`);
      const data = await res.json();

      if (header) {
        header.innerHTML = `
          <div class="detail-header-inner">
            <img class="detail-art" src="${data.thumbnail || '/assets/logo.png'}" style="border-radius:50%;">
            <div class="detail-meta">
              <div class="detail-type">ARTIST</div>
              <h1 class="detail-title">${data.name}</h1>
              <div class="detail-sub">${data.subscriberCount || 'Verified YouTube Artist'}</div>
              ${data.songs && data.songs.length ? `
                <button class="btn-play" onclick="Player.setQueue(${JSON.stringify(data.songs).replace(/"/g, '&quot;')}, 0)">
                  ▶ Play Top Songs
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      if (songs) {
        const trackList = data.songs || [];
        songs.innerHTML = `
          <h2 style="margin: 24px 0 16px;">Top Songs</h2>
          <div class="track-list">
            ${trackList.map((s, idx) => UI.renderTrackItem(s, idx, trackList)).join('')}
          </div>
        `;
      }
    } catch (err) {
      if (header) header.innerHTML = '<p style="color:var(--text-muted)">Could not load artist profile.</p>';
    }
  },

  async loadAlbum(browseId) {
    if (!browseId) return;
    const header = document.getElementById('albumHeader');
    const trackList = document.getElementById('albumTrackList');
    if (header) header.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const res = await fetch(`/api/album?browseId=${browseId}`);
      const data = await res.json();

      if (header) {
        header.innerHTML = `
          <div class="detail-header-inner">
            <img class="detail-art" src="${data.thumbnail || '/assets/logo.png'}">
            <div class="detail-meta">
              <div class="detail-type">ALBUM</div>
              <h1 class="detail-title">${data.title}</h1>
              <div class="detail-sub">${data.artists?.join(', ')} · ${data.year} · ${(data.songs || []).length} tracks</div>
              ${data.songs && data.songs.length ? `
                <button class="btn-play" onclick="Player.setQueue(${JSON.stringify(data.songs).replace(/"/g, '&quot;')}, 0)">
                  ▶ Play Album
                </button>
              ` : ''}
            </div>
          </div>
        `;
      }

      if (trackList) {
        const songs = data.songs || [];
        trackList.innerHTML = songs.map((s, idx) => UI.renderTrackItem(s, idx, songs)).join('');
      }
    } catch (err) {
      if (header) header.innerHTML = '<p style="color:var(--text-muted)">Could not load album.</p>';
    }
  }
};
