// Spatial D-Pad Navigation Engine for Samsung Smart TV Remote
const TVNavigation = {
    currentFocus: null,

    init() {
        // Register Tizen TV Remote Keys
        this.registerTizenKeys();

        // Listen for keyboard events (works with both TV remote & PC keyboard)
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Initial focus on first sidebar item
        const firstFocus = document.querySelector('.focusable');
        if (firstFocus) {
            this.setFocus(firstFocus);
        }
    },

    registerTizenKeys() {
        if (window.tizen && tizen.tvinputdevice) {
            const keysToRegister = [
                'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaStop',
                'MediaFastForward', 'MediaRewind', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
            ];
            keysToRegister.forEach(key => {
                try {
                    tizen.tvinputdevice.registerKey(key);
                } catch (e) {
                    console.log('[TVNav] Key registration ignored for:', key);
                }
            });
        }
    },

    setFocus(element) {
        if (!element) return;
        if (this.currentFocus) {
            this.currentFocus.classList.remove('focused');
        }
        this.currentFocus = element;
        this.currentFocus.classList.add('focused');

        // Smooth scroll element into view if inside a scrollable container
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    },

    handleKeyDown(e) {
        const keyCode = e.keyCode;
        const key = e.key;

        // Tizen Return / Back Button (keyCode 10009 or Backspace)
        if (keyCode === 10009 || key === 'Backspace') {
            e.preventDefault();
            if (window.App && window.App.handleBack) {
                window.App.handleBack();
            }
            return;
        }

        // Tizen Media Remote Keys
        if (keyCode === 415 || key === 'MediaPlay') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }
        if (keyCode === 19 || key === 'MediaPause') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }
        if (keyCode === 10252 || key === 'MediaPlayPause') {
            e.preventDefault();
            AudioPlayer.togglePlayPause();
            return;
        }

        // D-Pad Directional Navigation
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

    moveFocus(direction) {
        if (!this.currentFocus) {
            const first = document.querySelector('.focusable');
            if (first) this.setFocus(first);
            return;
        }

        const visibleFocusables = Array.from(document.querySelectorAll('.focusable')).filter(el => {
            return el.offsetParent !== null && window.getComputedStyle(el).display !== 'none';
        });

        const currentRect = this.currentFocus.getBoundingClientRect();
        let bestCandidate = null;
        let bestDistance = Infinity;

        visibleFocusables.forEach(candidate => {
            if (candidate === this.currentFocus) return;
            const candRect = candidate.getBoundingClientRect();

            let isValid = false;
            let primaryDist = 0;
            let secondaryDist = 0;

            if (direction === 'up' && candRect.bottom <= currentRect.top + 10) {
                isValid = true;
                primaryDist = currentRect.top - candRect.bottom;
                secondaryDist = Math.abs((candRect.left + candRect.width / 2) - (currentRect.left + currentRect.width / 2));
            } else if (direction === 'down' && candRect.top >= currentRect.bottom - 10) {
                isValid = true;
                primaryDist = candRect.top - currentRect.bottom;
                secondaryDist = Math.abs((candRect.left + candRect.width / 2) - (currentRect.left + currentRect.width / 2));
            } else if (direction === 'left' && candRect.right <= currentRect.left + 10) {
                isValid = true;
                primaryDist = currentRect.left - candRect.right;
                secondaryDist = Math.abs((candRect.top + candRect.height / 2) - (currentRect.top + currentRect.height / 2));
            } else if (direction === 'right' && candRect.left >= currentRect.right - 10) {
                isValid = true;
                primaryDist = candRect.left - currentRect.right;
                secondaryDist = Math.abs((candRect.top + candRect.height / 2) - (currentRect.top + currentRect.height / 2));
            }

            if (isValid) {
                const totalDist = primaryDist * 1.5 + secondaryDist;
                if (totalDist < bestDistance) {
                    bestDistance = totalDist;
                    bestCandidate = candidate;
                }
            }
        });

        if (bestCandidate) {
            this.setFocus(bestCandidate);
        }
    }
};