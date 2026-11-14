/**
 * AyushMuzic Web — Client-Side Router
 * Manages tab switching, dynamic detail pages (artist, album, playlist),
 * and browser history.
 */

window.Router = {
  currentPage: 'home',
  history: [],

  init() {
    // Navigation items click handling
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigate(el.dataset.page);
      });
    });

    // Topbar back / forward
    document.getElementById('backBtn')?.addEventListener('click', Router.goBack);
    document.getElementById('forwardBtn')?.addEventListener('click', Router.goForward);

    // Initial page
    Router.navigate('home', {}, false);
  },

  navigate(page, data = {}, pushHistory = true) {
    // Hide all pages (support both class names for compatibility)
    document.querySelectorAll('.page, .page-view').forEach(p => p.classList.remove('active'));

    // Update active nav item
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    Router.currentPage = page;
    if (pushHistory) {
      Router.history.push({ page, data });
    }

    switch (page) {
      case 'home':
        document.getElementById('pageHome')?.classList.add('active');
        UI.loadHome();
        break;
      case 'search':
        document.getElementById('pageSearch')?.classList.add('active');
        document.getElementById('searchInput')?.focus();
        UI.loadSearchCategories();
        break;
      case 'library':
        document.getElementById('pageLibrary')?.classList.add('active');
        Library.render();
        break;
      case 'analytics':
        document.getElementById('pageAnalytics')?.classList.add('active');
        Analytics.render();
        break;
      case 'browse':
        document.getElementById('pageBrowse')?.classList.add('active');
        UI.loadBrowse();
        break;
      case 'artist':
        document.getElementById('pageArtist')?.classList.add('active');
        UI.loadArtist(data.channelId);
        break;
      case 'album':
        document.getElementById('pageAlbum')?.classList.add('active');
        UI.loadAlbum(data.browseId);
        break;
      case 'playlist':
        document.getElementById('pagePlaylist')?.classList.add('active');
        break;
    }

    // Scroll to top of main content
    const main = document.getElementById('mainContent');
    if (main) main.scrollTop = 0;
  },

  goBack() {
    if (Router.history.length > 1) {
      Router.history.pop();
      const prev = Router.history[Router.history.length - 1];
      Router.navigate(prev.page, prev.data, false);
    }
  },

  goForward() {
    // Optional forward handling
  },

  showPlaylistDetail(playlist) {
    document.querySelectorAll('.page, .page-view').forEach(p => p.classList.remove('active'));
    const container = document.getElementById('pagePlaylist');
    if (!container) return;
    container.classList.add('active');

    const header = document.getElementById('playlistHeader');
    const trackList = document.getElementById('playlistTrackList');

    const songs = playlist.songs || [];
    const songsJson = JSON.stringify(songs).replace(/"/g, '&quot;');

    header.innerHTML = `
      <div class="detail-header-inner">
        <div class="detail-art" style="background:var(--accent-gradient); display:flex; align-items:center; justify-content:center; font-size:64px;">
          🎵
        </div>
        <div class="detail-meta">
          <div class="detail-type">PLAYLIST</div>
          <h1 class="detail-title">${playlist.title || 'Playlist'}</h1>
          <div class="detail-sub">${songs.length} songs · AyushMuzic Local</div>
          ${songs.length ? `<button class="btn-play" onclick="Player.setQueue(${songsJson}, 0)">▶ Play All</button>` : ''}
        </div>
      </div>
    `;

    trackList.innerHTML = songs.length ? songs.map((s, idx) => UI.renderTrackItem(s, idx, songs)).join('') : '<p style="color:var(--text-muted); padding:20px;">This playlist has no songs yet.</p>';
  }
};
