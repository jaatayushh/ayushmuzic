/**
 * AyushMuzic Web — Listening Analytics & Receipt Engine
 * Computes listening stats for the active profile (Guest, Ayush, Rohan, etc.)
 * and formats the official viral listening receipt.
 */

window.Analytics = {
  todayKey() {
    return new Date().toISOString().split('T')[0];
  },

  async init() {
    await Analytics.render();
  },

  async trackPlay(song) {
    if (!song) return;
    const dateKey = Analytics.todayKey();
    const recordId = `${DB.activeUser}_${dateKey}`;

    let record = await DB.get('analytics', recordId) || {
      id: recordId,
      userId: DB.activeUser,
      date: dateKey,
      totalSeconds: 0,
      songsPlayed: 0,
      artists: {},
      songs: {}
    };

    record.songsPlayed++;
    record.totalSeconds += Math.min(Number(song.duration) || 200, 600);

    const artistList = Array.isArray(song.artists) ? song.artists : [song.artist || 'Unknown'];
    for (const a of artistList) {
      record.artists[a] = (record.artists[a] || 0) + 1;
    }

    if (!record.songs[song.videoId]) {
      record.songs[song.videoId] = {
        title: song.title,
        artist: artistList[0],
        thumbnail: song.thumbnail,
        count: 0
      };
    }
    record.songs[song.videoId].count++;

    await DB.put('analytics', record);
    Analytics.render();
  },

  async getAggregated() {
    const allRecords = await DB.getAll('analytics');
    const userRecords = allRecords.filter(r => r.userId === DB.activeUser);

    const agg = {
      totalSeconds: 0,
      songsPlayed: 0,
      artists: {},
      songs: {},
      streak: 1
    };

    for (const rec of userRecords) {
      agg.totalSeconds += rec.totalSeconds || 0;
      agg.songsPlayed += rec.songsPlayed || 0;
      for (const [art, count] of Object.entries(rec.artists || {})) {
        agg.artists[art] = (agg.artists[art] || 0) + count;
      }
      for (const [id, s] of Object.entries(rec.songs || {})) {
        if (!agg.songs[id]) {
          agg.songs[id] = { ...s, count: 0 };
        }
        agg.songs[id].count += s.count;
      }
    }

    return agg;
  },

  async render() {
    const labelEl = document.getElementById('analyticsProfileLabel');
    if (labelEl) labelEl.textContent = DB.activeUserName;

    const agg = await Analytics.getAggregated();

    // Total Time
    const hours = Math.floor(agg.totalSeconds / 3600);
    const mins = Math.floor((agg.totalSeconds % 3600) / 60);
    const timeEl = document.getElementById('statTimeValue');
    if (timeEl) timeEl.textContent = `${hours}h ${mins}m`;

    // Songs Count
    const countEl = document.getElementById('statSongsValue');
    if (countEl) countEl.textContent = agg.songsPlayed;

    // Top Artists
    const topArtists = Object.entries(agg.artists)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const artListEl = document.getElementById('topArtistsList');
    if (artListEl) {
      artListEl.innerHTML = topArtists.length ? topArtists.map(([name, count], i) => `
        <div class="top-item">
          <span class="top-rank">${i + 1}</span>
          <div class="top-info">
            <div class="top-name">${name}</div>
            <div class="top-sub">${count} streams</div>
          </div>
        </div>
      `).join('') : `<p style="color:var(--text-muted)">Start playing tracks as ${DB.activeUserName} to track artists.</p>`;
    }

    // Top Songs
    const topSongs = Object.values(agg.songs)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const songsListEl = document.getElementById('topSongsList');
    if (songsListEl) {
      songsListEl.innerHTML = topSongs.length ? topSongs.map((s, i) => `
        <div class="top-item">
          <span class="top-rank">${i + 1}</span>
          <img class="top-thumb" src="${s.thumbnail || '/assets/logo.png'}">
          <div class="top-info">
            <div class="top-name">${s.title}</div>
            <div class="top-sub">${s.artist} · ${s.count} plays</div>
          </div>
        </div>
      `).join('') : `<p style="color:var(--text-muted)">Start playing tracks as ${DB.activeUserName} to track top songs.</p>`;
    }

    // Listening Receipt
    Analytics.renderReceipt(agg, topArtists, topSongs);
  },

  renderReceipt(agg, topArtists, topSongs) {
    const card = document.getElementById('receiptCard');
    if (!card) return;

    const hours = Math.floor(agg.totalSeconds / 3600);
    const mins = Math.floor((agg.totalSeconds % 3600) / 60);
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    card.innerHTML = `
      <div style="text-align: center; border-bottom: 2px dashed #333; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="font-size: 11px; letter-spacing: 3px; font-weight: 700; color: #555;">LISTENING RECEIPT</div>
        <div style="font-size: 22px; font-weight: 800; letter-spacing: 2px; margin: 4px 0;">AYUSHMUZIC</div>
        <div style="font-size: 11px; color: #555;">USER: <strong>${DB.activeUserName.toUpperCase()}</strong> · ${dateStr}</div>
      </div>

      <div style="font-size: 12px; line-height: 2;">
        <div style="display: flex; justify-content: space-between;">
          <span>HOURS LISTENED</span>
          <span style="font-weight: 700;">${hours}H ${mins}M</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>TRACKS PLAYED</span>
          <span style="font-weight: 700;">${agg.songsPlayed}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>ADS BLOCKED</span>
          <span style="font-weight: 700;">100% FREE</span>
        </div>
      </div>

      ${topArtists.length ? `
        <div style="border-top: 1px dashed #777; margin-top: 12px; padding-top: 10px;">
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #555; margin-bottom: 6px;">TOP ARTISTS</div>
          ${topArtists.map(([name, count], i) => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; line-height: 1.8;">
              <span>${i + 1}. ${name}</span>
              <span>${count} PLAYS</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${topSongs.length ? `
        <div style="border-top: 1px dashed #777; margin-top: 12px; padding-top: 10px;">
          <div style="font-size: 10px; font-weight: 700; letter-spacing: 1px; color: #555; margin-bottom: 6px;">TOP TRACKS</div>
          ${topSongs.map((s, i) => `
            <div style="display: flex; justify-content: space-between; font-size: 11px; line-height: 1.8;">
              <span style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${i + 1}. ${s.title}</span>
              <span>${s.count}×</span>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <div style="border-top: 2px dashed #333; margin-top: 16px; padding-top: 12px; text-align: center; font-size: 10px; color: #666; letter-spacing: 1px;">
        CARD: **** **** **** ${DB.activeUser.toUpperCase().substring(0, 8)}<br>
        AUTH CODE: AYUSH-MUZIC-v1.0.8<br>
        THANK YOU FOR LISTENING!
      </div>
    `;
  }
};
