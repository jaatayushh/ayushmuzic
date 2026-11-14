/**
 * AyushMuzic Web — 10-Band Graphic Equalizer Engine
 * Built on Web Audio API (BiquadFilterNodes). Supports presets & custom gains.
 */

window.Equalizer = {
  context: null,
  source: null,
  bands: [],
  frequencies: [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000],
  presets: {
    'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
    'Vocal Boost': [0, 0, 1, 3, 4, 3, 1, 0, 0, 0],
    'Rock': [4, 3, 1, -1, -2, 0, 2, 3, 4, 4],
    'Pop': [2, 1, 0, 1, 3, 3, 2, 1, 1, 0],
    'Hip-Hop': [5, 4, 3, 1, 0, 0, 1, 2, 2, 3],
    'Electronic': [4, 3, 2, 0, -1, 2, 3, 3, 3, 4],
    'Classical': [3, 2, 1, 0, 0, 0, 0, 1, 2, 3]
  },
  currentPreset: 'Flat',

  init(audioElement) {
    if (Equalizer.context) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      Equalizer.context = new AudioCtx();
      Equalizer.source = Equalizer.context.createMediaElementSource(audioElement);

      Equalizer.bands = Equalizer.frequencies.map((freq, i) => {
        const filter = Equalizer.context.createBiquadFilter();
        filter.type = (i === 0) ? 'lowshelf' : (i === Equalizer.frequencies.length - 1) ? 'highshelf' : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0;
        filter.gain.value = 0;
        return filter;
      });

      // Connect filter chain: source -> band0 -> band1 ... -> destination
      let current = Equalizer.source;
      for (const band of Equalizer.bands) {
        current.connect(band);
        current = band;
      }
      current.connect(Equalizer.context.destination);

      Equalizer.renderUI();
      console.log('✓ 10-Band Graphic Equalizer initialized');
    } catch (e) {
      console.warn('Equalizer audio routing warning:', e.message);
    }
  },

  setPreset(name) {
    const gains = Equalizer.presets[name] || Equalizer.presets['Flat'];
    gains.forEach((gain, i) => {
      if (Equalizer.bands[i]) {
        Equalizer.bands[i].gain.value = gain;
      }
      const slider = document.getElementById(`eq-slider-${i}`);
      const label = document.getElementById(`eq-gain-${i}`);
      if (slider) slider.value = gain;
      if (label) label.textContent = gain;
    });
    Equalizer.currentPreset = name;

    document.querySelectorAll('.eq-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === name);
    });
  },

  setBandGain(index, gain) {
    if (Equalizer.bands[index]) {
      Equalizer.bands[index].gain.value = gain;
    }
    Equalizer.currentPreset = 'Custom';
    document.querySelectorAll('.eq-preset-btn').forEach(btn => btn.classList.remove('active'));
  },

  renderUI() {
    const presetsEl = document.getElementById('eqPresets');
    const bandsEl = document.getElementById('eqBands');
    if (!presetsEl || !bandsEl) return;

    // Render preset buttons
    presetsEl.innerHTML = Object.keys(Equalizer.presets).map(name => `
      <button class="eq-preset-btn ${name === Equalizer.currentPreset ? 'active' : ''}" 
              data-preset="${name}" 
              onclick="Equalizer.setPreset('${name}')">${name}</button>
    `).join('');

    // Render 10 sliders
    bandsEl.innerHTML = Equalizer.frequencies.map((freq, i) => {
      const label = freq >= 1000 ? (freq / 1000) + 'k' : freq + 'Hz';
      return `
        <div class="eq-band">
          <span class="eq-gain-label" id="eq-gain-${i}">0</span>
          <input type="range" min="-12" max="12" value="0" step="0.5" id="eq-slider-${i}"
                 oninput="Equalizer.setBandGain(${i}, parseFloat(this.value)); document.getElementById('eq-gain-${i}').textContent = this.value;">
          <span class="eq-freq-label">${label}</span>
        </div>
      `;
    }).join('');
  },

  toggle() {
    const panel = document.getElementById('npEqPanel');
    if (!panel) return;
    const isHidden = panel.classList.contains('hidden');
    document.getElementById('npLyricsPanel')?.classList.add('hidden');
    document.getElementById('npQueuePanel')?.classList.add('hidden');

    if (isHidden) {
      panel.classList.remove('hidden');
    } else {
      panel.classList.add('hidden');
    }
  }
};
