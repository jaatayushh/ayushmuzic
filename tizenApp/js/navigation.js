// =====================================================
// AyushMuzic Tizen TV — D-Pad Navigation Engine v2.0
// Spatial nearest-element focus for TV remote + keyboard
// =====================================================

const TVNavigation = {
    currentFocus: null,
    _history: [],

    init() {
        this._registerTizenKeys();
        window.addEventListener('keydown', e => this._onKey(e), true);
        // Hover-on-cursor-move (for browser testing with mouse)
        document.addEventListener('mousemove', () => {
            document.body.classList.add('using-mouse');
        });

        // Auto-focus first visible focusable
        requestAnimationFrame(() => {
            const first = document.querySelector('#sidebar .focusable');
            if (first) this.setFocus(first);
        });
    },

    _registerTizenKeys() {
        if (!window.tizen || !tizen.tvinputdevice) return;
        const keys = [
            'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
            'MediaFastForward', 'MediaRewind', 'MediaTrackNext', 'MediaTrackPrevious',
            'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
            '0','1','2','3','4','5','6','7','8','9'
        ];
        keys.forEach(k => {
            try { tizen.tvinputdevice.registerKey(k); } catch {}
        });
    },

    setFocus(el) {
        if (!el || el === this.currentFocus) return;
        if (this.currentFocus) this.currentFocus.classList.remove('focused');
        this.currentFocus = el;
        el.classList.add('focused');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    },

    pushHistory(el) {
        if (el) this._history.push(el);
    },

    popHistory() {
        return this._history.pop();
    },

    _onKey(e) {
        const k = e.keyCode;
        const key = e.key;

        // ── Back / Return ──
        if (k === 10009 || key === 'Escape' || key === 'Backspace') {
            if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
            e.preventDefault();
            if (window.App) App.handleBack();
            return;
        }

        // ── Media keys ──
        if (k === 415 || key === 'MediaPlay') { e.preventDefault(); AudioPlayer.togglePlayPause(); return; }
        if (k === 19  || key === 'MediaPause') { e.preventDefault(); AudioPlayer.togglePlayPause(); return; }
        if (k === 10252 || key === 'MediaPlayPause') { e.preventDefault(); AudioPlayer.togglePlayPause(); return; }
        if (k === 417 || key === 'MediaFastForward') { e.preventDefault(); AudioPlayer.seek(AudioPlayer.currentTime + 10); return; }
        if (k === 412 || key === 'MediaRewind') { e.preventDefault(); AudioPlayer.seek(AudioPlayer.currentTime - 10); return; }
        if (k === 10233 || key === 'MediaTrackNext') { e.preventDefault(); AudioPlayer.playNext(); return; }
        if (k === 10232 || key === 'MediaTrackPrevious') { e.preventDefault(); AudioPlayer.playPrev(); return; }

        // ── D-Pad ──
        switch (key) {
            case 'ArrowUp':    e.preventDefault(); this._move('up'); break;
            case 'ArrowDown':  e.preventDefault(); this._move('down'); break;
            case 'ArrowLeft':  e.preventDefault(); this._move('left'); break;
            case 'ArrowRight': e.preventDefault(); this._move('right'); break;
            case 'Enter':
                e.preventDefault();
                if (this.currentFocus) this.currentFocus.click();
                break;
        }
    },

    _move(dir) {
        if (!this.currentFocus) {
            const first = document.querySelector('.focusable');
            if (first) this.setFocus(first);
            return;
        }

        const all = Array.from(document.querySelectorAll('.focusable')).filter(el => {
            if (!el.offsetParent) return false;
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
        });

        const curRect = this.currentFocus.getBoundingClientRect();
        const curCX = curRect.left + curRect.width / 2;
        const curCY = curRect.top + curRect.height / 2;

        let best = null;
        let bestScore = Infinity;

        for (const el of all) {
            if (el === this.currentFocus) continue;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            let valid = false;
            let primary = 0, secondary = 0;

            if (dir === 'up'    && rect.bottom <= curRect.top + 8)    { valid = true; primary = curRect.top - cy;    secondary = Math.abs(cx - curCX); }
            if (dir === 'down'  && rect.top >= curRect.bottom - 8)    { valid = true; primary = cy - curRect.bottom; secondary = Math.abs(cx - curCX); }
            if (dir === 'left'  && rect.right <= curRect.left + 8)   { valid = true; primary = curRect.left - cx;   secondary = Math.abs(cy - curCY); }
            if (dir === 'right' && rect.left >= curRect.right - 8)   { valid = true; primary = cx - curRect.right;  secondary = Math.abs(cy - curCY); }

            if (valid) {
                // Score: primary distance weighted more than secondary
                const score = primary * 2 + secondary * 0.8;
                if (score < bestScore) { bestScore = score; best = el; }
            }
        }

        if (best) this.setFocus(best);
    }
};
