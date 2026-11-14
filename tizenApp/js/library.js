/**
 * AyushMuzic Web — Library Management
 * Tracks user-specific history, play counts (for "Most Played"), liked tracks,
 * and syncs telemetry to the AyushFlix Admin Panel.
 */

window.Library = {
  currentTab: 'favorites',

  async init() {
    document.querySelectorAll('[data-lib]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-lib]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Library.currentTab = tab.dataset.lib;
        Library.render();
      });
    });

    document.getElementById('createPlaylistBtn')?.addEventListener('click', () => {
      Library.createPlaylistModal();
    });

    await Library.renderSidebar();
  },

  async isFavorite(videoId) {
    if (!videoId) return false;
    const key = `${DB.activeUser}_${videoId}`;
    const item = await DB.get('favorites', key);
    return !!item;
  },

  async toggleFavorite(song) {
    if (!song || !song.videoId) return false;
    const key = `${DB.activeUser}_${song.videoId}`;
    const fav = await Library.isFavorite(song.videoId);

    if (fav) {
      await DB.delete('favorites', key);
      Player.updateFavoriteButtons(false);
      showToast('Removed from Liked Songs');
    } else {
      await DB.put('favorites', {
        id: key,
        userId: DB.activeUser,
        ...song,
        savedAt: Date.now()
      });
      Player.updateFavoriteButtons(true);
      showToast('Added to Liked Songs ♥');
    }

    await Library.renderSidebar();
    if (Library.currentTab === 'favorites') {
      await Library.render();
    }
    return !fav;
  },

  async recordPlay(song) {
    if (!song || !song.videoId) return;

    // 1. Add to user's history
    const historyId = `${DB.activeUser}_${song.videoId}_${Date.now()}`;
    await DB.put('history', {
      id: historyId,
      userId: DB.activeUser,
      ...song,
      timestamp: Date.now()
    });

    // 2. Increment play count for "Most Played"
    const countKey = `${DB.activeUser}_${song.videoId}`;
    const existing = await DB.get('playCounts', countKey);
    const count = (existing?.count || 0) + 1;
    await DB.put('playCounts', {
      id: countKey,
      userId: DB.activeUser,
      videoId: song.videoId,
      song: song,
      count: count,
      lastPlayed: Date.now()
    });

    // 3. Send telemetry ping to AyushFlix Admin Panel
    try {
      fetch('http://localhost:3000/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'ayushmuzic',
          eventType: 'song_play',
          userId: DB.activeUser,
          profileName: DB.activeUserName,
          title: song.title,
          artist: Array.isArray(song.artists) ? song.artists.join(', ') : (song.artist || '')
        })
      }).catch(() => {});
    } catch {}

    // Refresh recently played and most played carousels on home
    UI.refreshUserRows();
  },

  async getRecentlyPlayed() {
    const allHistory = await DB.getAll('history');
    const userHistory = allHistory.filter(h => h.userId === DB.activeUser);
    userHistory.sort((a, b) => b.timestamp - a.timestamp);

    // Deduplicate by videoId, keeping most recent
    const seen = new Set();
    const result = [];
    for (const item of userHistory) {
      if (!seen.has(item.videoId)) {
        seen.add(item.videoId);
        result.push(item);
      }
      if (result.length >= 15) break;
    }
    return result;
  },

  async getMostPlayed() {
    const allCounts = await DB.getAll('playCounts');
    const userCounts = allCounts.filter(c => c.userId === DB.activeUser);
    userCounts.sort((a, b) => b.count - a.count);
    return userCounts.slice(0, 15).map(c => ({
      ...c.song,
      playCount: c.count
    }));
  },

  async createPlaylistModal() {
    const name = prompt('Enter playlist name:');
    if (!name || !name.trim()) return;

    const newPlaylist = {
      id: `pl_${DB.activeUser}_${Date.now()}`,
      userId: DB.activeUser,
      name: name.trim(),
      songs: [],
      createdAt: Date.now()
    };

    await DB.put('playlists', newPlaylist);
    showToast(`Playlist "${name.trim()}" created`);
    await Library.renderSidebar();
    if (Library.currentTab === 'playlists') {
      await Library.render();
    }
  },

  async render() {
    const container = document.getElementById('libraryContent');
    if (!container) return;

    if (Library.currentTab === 'favorites') {
      const allFavs = await DB.getAll('favorites');
      const userFavs = allFavs.filter(f => f.userId === DB.activeUser);
      userFavs.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));

      if (!userFavs.length) {
        container.innerHTML = `
          <div style="text-align:center; padding: 60px 20px; color:var(--text-muted)">
            <div style="font-size: 48px; margin-bottom: 12px;">♡</div>
            <h3>No Liked Songs Yet</h3>
            <p style="margin-top: 6px;">Tap the heart on any song while listening as <strong>${DB.activeUserName}</strong>.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 16px;">
          <span style="color:var(--text-secondary); font-size:14px;">${userFavs.length} songs</span>
          <button class="btn-play" onclick="Player.setQueue(${JSON.stringify(userFavs).replace(/"/g, '&quot;')}, 0)">▶ Play All</button>
        </div>
        <div class="track-list">
          ${userFavs.map((s, idx) => UI.renderTrackItem(s, idx, userFavs)).join('')}
        </div>
      `;
    } else if (Library.currentTab === 'history') {
      const recent = await Library.getRecentlyPlayed();

      if (!recent.length) {
        container.innerHTML = `
          <div style="text-align:center; padding: 60px 20px; color:var(--text-muted)">
            <div style="font-size: 48px; margin-bottom: 12px;">⏱️</div>
            <h3>No Playback History</h3>
            <p style="margin-top: 6px;">Songs you stream as <strong>${DB.activeUserName}</strong> will appear here.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="track-list">
          ${recent.map((s, idx) => UI.renderTrackItem(s, idx, recent)).join('')}
        </div>
      `;
    } else if (Library.currentTab === 'playlists') {
      const allPlaylists = await DB.getAll('playlists');
      const userPlaylists = allPlaylists.filter(p => p.userId === DB.activeUser);

      if (!userPlaylists.length) {
        container.innerHTML = `
          <div style="text-align:center; padding: 60px 20px; color:var(--text-muted)">
            <div style="font-size: 48px; margin-bottom: 12px;">🎵</div>
            <h3>No Custom Playlists</h3>
            <p style="margin-top: 6px;">Create your first playlist using the button below.</p>
            <button class="btn-primary" style="margin-top: 16px;" onclick="Library.createPlaylistModal()">Create Playlist</button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="song-grid">
          ${userPlaylists.map(pl => `
            <div class="song-card" onclick="Router.showPlaylistDetail({ title: '${pl.name}', songs: ${JSON.stringify(pl.songs).replace(/"/g, '&quot;')} })">
              <div class="song-card-art" style="background:var(--accent-gradient); display:flex; align-items:center; justify-content:center; font-size:36px;">
                🎵
              </div>
              <div class="song-card-title">${pl.name}</div>
              <div class="song-card-artist">${pl.songs.length} tracks</div>
            </div>
          `).join('')}
        </div>
      `;
    }
  },

  async renderSidebar() {
    const list = document.getElementById('sidebarLibraryList');
    if (!list) return;

    const allFavs = await DB.getAll('favorites');
    const userFavs = allFavs.filter(f => f.userId === DB.activeUser);

    const allPlaylists = await DB.getAll('playlists');
    const userPlaylists = allPlaylists.filter(p => p.userId === DB.activeUser);

    let html = `
      <div class="sidebar-lib-item" onclick="Router.navigate('library'); Library.currentTab='favorites'; Library.render();">
        <div class="sidebar-lib-thumb" style="background: var(--accent-gradient)">♥</div>
        <div>
          <div class="sidebar-lib-name">Liked Songs</div>
          <div class="sidebar-lib-sub">${userFavs.length} songs</div>
        </div>
      </div>
    `;

    html += userPlaylists.map(pl => `
      <div class="sidebar-lib-item" onclick="Router.showPlaylistDetail({ title: '${pl.name}', songs: ${JSON.stringify(pl.songs).replace(/"/g, '&quot;')} })">
        <div class="sidebar-lib-thumb" style="background: var(--bg-card)">🎵</div>
        <div>
          <div class="sidebar-lib-name">${pl.name}</div>
          <div class="sidebar-lib-sub">${pl.songs.length} songs</div>
        </div>
      </div>
    `).join('');

    list.innerHTML = html;
  }
};
