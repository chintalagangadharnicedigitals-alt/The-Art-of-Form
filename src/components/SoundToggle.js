export class SoundToggle {
  constructor() {
    this.btn = document.getElementById('sound-toggle');
    this.label = this.btn ? this.btn.querySelector('.sound-label') : null;
    this.audioCtx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.bgGain = null;
    this.sfxGain = null;
    this.oscillators = [];
    this.lastStageSoundTime = 0;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check session storage for sound preference
    const storedState = sessionStorage.getItem('art_of_form_sound');
    this.autoStartOnUserGesture = storedState === 'true';

    if (this.btn) {
      this.btn.addEventListener('click', () => this.toggle());
    }

    // Explicit user gesture listener to resume audio context if enabled
    const gestureHandler = () => {
      if (this.autoStartOnUserGesture && !this.isPlaying) {
        this.enableSound();
      }
      window.removeEventListener('click', gestureHandler);
      window.removeEventListener('keydown', gestureHandler);
      window.removeEventListener('touchstart', gestureHandler);
    };
    window.addEventListener('click', gestureHandler, { once: true });
    window.addEventListener('keydown', gestureHandler, { once: true });
    window.addEventListener('touchstart', gestureHandler, { once: true });
  }

  initAudio() {
    if (this.audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioCtx = new AudioContext();

    // Master Gain Node
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);

    // Background Music Gain Node (low volume luxury ambient pad)
    this.bgGain = this.audioCtx.createGain();
    this.bgGain.gain.setValueAtTime(0.12, this.audioCtx.currentTime);

    // Sound Effects Gain Node
    this.sfxGain = this.audioCtx.createGain();
    this.sfxGain.gain.setValueAtTime(0.25, this.audioCtx.currentTime);
    this.sfxGain.connect(this.masterGain);

    // Warm Low-pass Ambient Filter
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420, this.audioCtx.currentTime);

    this.bgGain.connect(filter);
    filter.connect(this.masterGain);

    // Build Luxury Orchestral Ambient Pad (F#1 46.25Hz, C#2 69.30Hz, A#2 116.54Hz, F#3 185Hz, C#4 277.18Hz)
    const freqs = [46.25, 69.30, 116.54, 185.00, 277.18];

    freqs.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      // Subtle LFO breathing rate (slow 0.08Hz sweep)
      const lfo = this.audioCtx.createOscillator();
      const lfoGain = this.audioCtx.createGain();
      lfo.frequency.setValueAtTime(0.08 + idx * 0.03, this.audioCtx.currentTime);
      lfoGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      lfo.connect(oscGain.gain);
      lfo.start();

      oscGain.gain.setValueAtTime(0.1, this.audioCtx.currentTime);
      osc.connect(oscGain);
      oscGain.connect(this.bgGain);

      osc.start();
      this.oscillators.push(osc);
    });
  }

  enableSound() {
    if (!this.audioCtx) this.initAudio();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();

    this.isPlaying = true;
    sessionStorage.setItem('art_of_form_sound', 'true');

    if (this.btn) this.btn.classList.add('is-active');
    if (this.label) this.label.innerText = 'SOUND ON';

    this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.25, this.audioCtx.currentTime + 1.2);
  }

  disableSound() {
    this.isPlaying = false;
    sessionStorage.setItem('art_of_form_sound', 'false');

    if (this.btn) this.btn.classList.remove('is-active');
    if (this.label) this.label.innerText = 'SOUND OFF';

    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.cancelScheduledValues(this.audioCtx.currentTime);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.8);
    }
  }

  toggle() {
    if (!this.isPlaying) {
      this.enableSound();
      this.playShimmer();
    } else {
      this.disableSound();
    }
  }

  // --- LUXURY WATCH SOUND EFFECTS ---

  /** Stage 01: Soft Cinematic Shimmer */
  playShimmer() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    [554.37, 830.61, 1108.73, 1661.22].forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.04, now + idx * 0.08 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 1.25);
    });
  }

  /** Stage 02: Delicate Metallic Rotation Movement */
  playMetallicRotate() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
    filter.Q.setValueAtTime(4.0, now);

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.03, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  /** Stage 03: Quiet Precision 28,800 VPH Ticking */
  playPrecisionTick() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    for (let t = 0; t < 4; t++) {
      const tickTime = now + t * 0.12;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(3200 + (t % 2 === 0 ? 300 : 0), tickTime);
      gain.gain.setValueAtTime(0.025, tickTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, tickTime + 0.025);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(tickTime);
      osc.stop(tickTime + 0.03);
    }
  }

  /** Stage 04: Subtle Mechanical Crown Click */
  playCrownClick() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  /** Stage 05: Gentle Clockwork Balance Ring */
  playClockworkAmbience() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  /** Stage 06 & Finish Buttons: Refined Metallic Chime */
  playMaterialChime(finish = 'gold') {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const baseFreq = finish === 'black' ? 587.33 : finish === 'silver' ? 880.00 : 739.99; // D5, A5, F#5
    
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2, now + 0.4);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.75);
  }

  /** Stage 07: Profile Sweep Tone */
  playProfileTone() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.5);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.65);
  }

  /** Stage 08: Final Hero Soft Sub-Impact / Swell */
  playSubImpact() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 1.05);

    this.playShimmer();
  }

  /** Stage 09 / Buttons: Subtle UI Glass Click */
  playUIClick() {
    if (!this.isPlaying || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /** Dispatch Sound Effect on Stage Change (Debounced & Checked) */
  onStageChange(stageIdx) {
    if (!this.isPlaying || this.prefersReducedMotion) return;
    const now = Date.now();
    if (now - this.lastStageSoundTime < 600) return; // Prevent rapid re-triggering
    this.lastStageSoundTime = now;

    switch (stageIdx) {
      case 0: this.playShimmer(); break;
      case 1: this.playMetallicRotate(); break;
      case 2: this.playPrecisionTick(); break;
      case 3: this.playCrownClick(); break;
      case 4: this.playClockworkAmbience(); break;
      case 5: this.playMaterialChime('gold'); break;
      case 6: this.playProfileTone(); break;
      case 7: this.playSubImpact(); break;
      case 8: this.playUIClick(); break;
    }
  }

  // Alias for backward compatibility
  playChime() {
    this.playMaterialChime('gold');
  }
}
