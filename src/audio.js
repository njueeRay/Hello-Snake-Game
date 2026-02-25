/**
 * AudioSystem: synthesized sounds via Web Audio API.
 * AudioContext is created lazily on the first user-gesture-triggered call.
 */
export class AudioSystem {
  constructor() {
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.muted = false;
  }

  /** Returns (creating if needed) the shared AudioContext. */
  _getContext() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Schedules a single oscillator note at a given audio-graph time.
   * Extracted so playLevelUp can loop without defining closures per iteration.
   *
   * @param {number} freq        - frequency in Hz
   * @param {OscillatorType} type
   * @param {number} startTime   - AudioContext time (seconds)
   * @param {number} duration    - seconds
   * @param {number} [volume]    - peak gain 0-1
   */
  _scheduleNote(freq, type, startTime, duration, volume = 0.25) {
    const ctx = this._getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /** Crisp ascending blip: 400 Hz → 600 Hz, 80 ms, sine. */
  playEat() {
    if (this.muted) return;
    const ctx = this._getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(600, now + 0.08);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain.gain.linearRampToValueAtTime(0, now + 0.08);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /** Triumphant arpeggio: C5 → E5 → G5 → C6, triangle wave. */
  playLevelUp() {
    if (this.muted) return;
    const ctx = this._getContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    const noteDuration = 0.1;
    const baseTime = ctx.currentTime;

    for (let i = 0; i < notes.length; i++) {
      this._scheduleNote(notes[i], 'triangle', baseTime + i * noteDuration, noteDuration);
    }
  }

  /** Descending buzz: 300 Hz → 100 Hz, 400 ms, sawtooth. */
  playDeath() {
    if (this.muted) return;
    const ctx = this._getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  /** Subtle click: 200 Hz, 50 ms, sine. */
  playPause() {
    if (this.muted) return;
    const ctx = this._getContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(200, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.005);
    gain.gain.linearRampToValueAtTime(0, now + 0.05);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  /** Two-note chime for golden food pickup. */
  playBonus() {
    if (this.muted) return;
    const ctx = this._getContext();
    const now = ctx.currentTime;
    this._scheduleNote(880, 'sine', now, 0.1, 0.2);
    this._scheduleNote(1320, 'sine', now + 0.08, 0.15, 0.25);
  }
}
