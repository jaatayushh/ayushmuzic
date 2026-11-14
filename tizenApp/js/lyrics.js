/**
 * AyushMuzic Web — Synced Lyrics Engine
 * Fetches time-synced lyrics from LRCLIB, parses LRC timestamps,
 * highlights current lyric line, and allows tap-to-seek.
 */

window.Lyrics = {
  lines: [],          // [{ time: 14.5, text: "I'm tryna put you in the worst mood..." }]
  currentIndex: -1,
  isVisible: false,

  async loadForSong(song) {
    Lyrics.lines = [];
    Lyrics.currentIndex = -1;
    const container = document.getElementById('npLyricsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-spinner"></div><p style="text-align:center; color:var(--text-muted)">Searching synced lyrics...</p>';

    try {
      const artist = Array.isArray(song.artists) ? song.artists[0] : (song.artist || '');
      const res = await fetch(`/api/lyrics?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(artist)}&duration=${song.duration || 0}`);
      const data = await res.json();

      if (data.syncedLyrics) {
        Lyrics.lines = Lyrics.parseLRC(data.syncedLyrics);
        Lyrics.render(container);
      } else if (data.plainLyrics) {
        container.innerHTML = data.plainLyrics.split('\n').map(line => 
          `<div class="lyrics-line plain">${line || '&nbsp;'}</div>`
        ).join('');
      } else {
        container.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-muted)">No lyrics found for this song.</div>';
      }
    } catch (err) {
      console.error('Lyrics error:', err);
      container.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-muted)">Could not load lyrics.</div>';
    }
  },

  parseLRC(lrcString) {
    const lines = lrcString.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const rawLine of lines) {
      const match = timeRegex.exec(rawLine);
      if (match) {
        const mins = parseInt(match[1], 10);
        const secs = parseInt(match[2], 10);
        const ms = parseInt(match[3].padEnd(3, '0').substring(0, 3), 10);
        const time = mins * 60 + secs + (ms / 1000);
        const text = rawLine.replace(timeRegex, '').trim();
        if (text) {
          result.push({ time, text });
        }
      }
    }
    return result.sort((a, b) => a.time - b.time);
  },

  render(container) {
    if (!Lyrics.lines.length) return;
    container.innerHTML = Lyrics.lines.map((line, index) => `
      <div class="lyrics-line" data-index="${index}" data-time="${line.time}" onclick="Player.seek(${line.time})">
        ${line.text}
      </div>
    `).join('');
  },

  updateHighlight(currentTime) {
    if (!Lyrics.lines.length) return;
    let newIndex = -1;

    for (let i = Lyrics.lines.length - 1; i >= 0; i--) {
      if (currentTime >= Lyrics.lines[i].time) {
        newIndex = i;
        break;
      }
    }

    if (newIndex === Lyrics.currentIndex) return;
    Lyrics.currentIndex = newIndex;

    const container = document.getElementById('npLyricsContainer');
    if (!container) return;

    const lineElements = container.querySelectorAll('.lyrics-line');
    lineElements.forEach((el, idx) => {
      if (idx === newIndex) {
        el.classList.add('active');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        el.classList.remove('active');
      }
    });
  },

  toggle() {
    const panel = document.getElementById('npLyricsPanel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    // Hide other panels
    document.getElementById('npQueuePanel')?.classList.add('hidden');
    document.getElementById('npEqPanel')?.classList.add('hidden');
    
    if (isHidden) {
      panel.classList.remove('hidden');
      Lyrics.isVisible = true;
    } else {
      panel.classList.add('hidden');
      Lyrics.isVisible = false;
    }
  }
};
