/**
 * AyushMuzic Tizen Smart TV — Spatial Remote Control Navigation Engine
 * Full D-Pad 4-way spatial navigation, Tizen remote media keys, and Return button support.
 */

window.TVNavigation = {
  currentFocus: null,
  focusableSelector: 'button, a, input, .focusable, .song-card, .song-row, .m3-chip, .filter-pill-tab, .nav-item, .profile-item, .queue-item, .horizontal-card-strip > div',

  init() {
    this.registerTizenKeys();
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Auto-mark focusable elements
    setInterval(() => this.scanFocusables(), 1000);

    // Initial focus on Home nav item
    setTimeout(() => {
      const homeNav = document.querySelector('.nav-item[data-page="home"]');
      if (homeNav) {
        this.setFocus(homeNav);
      }
    }, 500);

    console.log('✓ TV Navigation Engine Active');
  },

  registerTizenKeys() {
    if (window.tizen && tizen.tvinputdevice) {
      const keys = [
        'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
        'MediaFastForward', 'MediaRewind', 'MediaTrackNext', 'MediaTrackPrevious',
        '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
      ];
      keys.forEach(k => {
        try {
          tizen.tvinputdevice.registerKey(k);
        } catch (e) {}
      });
    }
  },

  scanFocusables() {
    document.querySelectorAll(this.focusableSelector).forEach(el => {
      if (!el.classList.contains('focusable')) {
        el.classList.add('focusable');
      }
    });
  },

  setFocus(el) {
    if (!el) return;
    if (this.currentFocus) {
      this.currentFocus.classList.remove('focused');
    }
    this.currentFocus = el;
    this.currentFocus.classList.add('focused');
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  },

  handleKeyDown(e) {
    const code = e.keyCode;
    const key = e.key;

    // 1. Tizen Return / Back Button (10009 or Escape or Backspace)
    if (code === 10009 || key === 'Escape' || (key === 'Backspace' && document.activeElement?.tagName !== 'INPUT')) {
      e.preventDefault();
      this.handleBackAction();
      return;
    }

    // 2. Media Remote Keys
    if (code === 415 || key === 'MediaPlay') {
      e.preventDefault();
      Player.play();
      return;
    }
    if (code === 19 || key === 'MediaPause') {
      e.preventDefault();
      Player.pause();
      return;
    }
    if (code === 10252 || key === 'MediaPlayPause') {
      e.preventDefault();
      Player.togglePlay();
      return;
    }
    if (code === 10233 || key === 'MediaTrackNext') {
      e.preventDefault();
      Player.next();
      return;
    }
    if (code === 10232 || key === 'MediaTrackPrevious') {
      e.preventDefault();
      Player.prev();
      return;
    }

    // 3. D-Pad Directional Navigation
    switch (key) {
      case 'ArrowUp':
        e.preventDefault();
        this.moveFocus('up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.moveFocus('down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.moveFocus('left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.moveFocus('right');
        break;
      case 'Enter':
        e.preventDefault();
        if (this.currentFocus) {
          this.currentFocus.click();
        }
        break;
    }
  },

  handleBackAction() {
    // If Now Playing overlay open, close it
    const npOverlay = document.getElementById('nowPlayingOverlay');
    if (npOverlay && !npOverlay.classList.contains('hidden')) {
      Player.closeNowPlaying();
      return;
    }

    // If on a subpage, return to Home
    if (window.Router && Router.currentPage !== 'home') {
      Router.navigate('home');
      return;
    }

    // Exit application on Samsung TV
    if (window.tizen && tizen.application) {
      tizen.application.getCurrentApplication().exit();
    }
  },

  moveFocus(direction) {
    this.scanFocusables();

    if (!this.currentFocus) {
      const first = document.querySelector('.focusable');
      if (first) this.setFocus(first);
      return;
    }

    const allFocusables = Array.from(document.querySelectorAll('.focusable')).filter(el => {
      if (el.offsetParent === null) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    });

    const cur = this.currentFocus.getBoundingClientRect();
    const curX = cur.left + cur.width / 2;
    const curY = cur.top + cur.height / 2;

    let bestEl = null;
    let minDistance = Infinity;

    allFocusables.forEach(target => {
      if (target === this.currentFocus) return;
      const tr = target.getBoundingClientRect();
      const trX = tr.left + tr.width / 2;
      const trY = tr.top + tr.height / 2;

      let valid = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      if (direction === 'up' && tr.bottom <= cur.top + 8) {
        valid = true;
        primaryDist = cur.top - tr.bottom;
        secondaryDist = Math.abs(curX - trX);
      } else if (direction === 'down' && tr.top >= cur.bottom - 8) {
        valid = true;
        primaryDist = tr.top - cur.bottom;
        secondaryDist = Math.abs(curX - trX);
      } else if (direction === 'left' && tr.right <= cur.left + 8) {
        valid = true;
        primaryDist = cur.left - tr.right;
        secondaryDist = Math.abs(curY - trY);
      } else if (direction === 'right' && tr.left >= cur.right - 8) {
        valid = true;
        primaryDist = tr.left - cur.right;
        secondaryDist = Math.abs(curY - trY);
      }

      if (valid) {
        const dist = primaryDist * 1.5 + secondaryDist;
        if (dist < minDistance) {
          minDistance = dist;
          bestEl = target;
        }
      }
    });

    if (bestEl) {
      this.setFocus(bestEl);
    }
  }
};

window.addEventListener('load', () => TVNavigation.init());
