import { ATTACK_SECONDS, DECAY_TAUS, releaseLevel } from './excitation.js';
import { modesForVoice, envelope, NOTES, TINE_INDEX } from './model.js';
export const MAX_VOICES = 48;
export const STEAL_FADE = 0.06;
export const voiceLevel = releaseLevel;
export class InstrumentAudio {
  constructor() { this.context = null; this.voices = []; this.dampers = new Set(); this.nextId = 1; }
  async enable() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain(); this.master.gain.value = 0.24;
      this.limiter = this.context.createDynamicsCompressor();
      this.master.connect(this.limiter).connect(this.context.destination);
    }
    await this.context.resume();
  }
  get time() { return this.context?.currentTime || 0; }
  retire(voice, duration = STEAL_FADE) {
    const now = this.time;
    if (voice.end <= now) return;
    const current = releaseLevel(voice, now);
    voice.fadeAt = now; voice.fadeFrom = current;
    voice.end = Math.min(voice.end, now + duration);
    voice.fadeDuration = voice.end - now;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(current, now);
    voice.gain.gain.linearRampToValueAtTime(0, voice.end);
    voice.nodes.forEach(node => node.stop(voice.end));
  }
  strike(index, patch, velocity = 0.8, when = this.time, position = patch.strikePosition ?? 0.37) {
    if (!this.context || !Number.isInteger(index) || index < 0 || index > TINE_INDEX || velocity <= 0 || this.dampers.has(index)) return null;
    this.voices = this.voices.filter(voice => voice.end > this.time);
    if (this.voices.length >= MAX_VOICES) this.retire(this.voices.shift());
    const modes = modesForVoice(index, patch, this.context.sampleRate, { position, velocity });
    if (!modes.some(mode => mode.amplitude > 1e-8)) return null;
    const voiceGain = this.context.createGain(), pan = this.context.createStereoPanner();
    pan.pan.value = (index === TINE_INDEX ? 0 : index / 7 * 2 - 1) * patch.spread;
    voiceGain.connect(pan).connect(this.master);
    const voice = { id: this.nextId++, position, material: patch.material, index, time: when, modes, velocity, end: when + modes[0].decay * DECAY_TAUS, nodes: [], gain: voiceGain };
    let remaining = modes.filter(mode => mode.amplitude > 1e-8).length;
    for (const mode of modes) {
      if (mode.amplitude <= 1e-8) continue;
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.frequency.value = mode.frequency;
      oscillator.connect(gain).connect(voiceGain);
      // Resolve the 4ms attack separately so long decays cannot smear it.
      const attack = new Float32Array(32);
      for (let i = 0; i < attack.length; i++) attack[i] = mode.amplitude * velocity * envelope(i / (attack.length - 1) * ATTACK_SECONDS, mode.decay);
      gain.gain.setValueCurveAtTime(attack, when, ATTACK_SECONDS);
      gain.gain.exponentialRampToValueAtTime(mode.amplitude * velocity * Math.exp(-DECAY_TAUS), when + mode.decay * DECAY_TAUS);
      // End the signal explicitly, even when an offline renderer retains the source.
      gain.gain.setValueAtTime(0, when + mode.decay * DECAY_TAUS);
      oscillator.start(when); oscillator.stop(when + mode.decay * DECAY_TAUS);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); if (--remaining === 0) { voiceGain.disconnect(); pan.disconnect(); } };
      voice.nodes.push(oscillator);
    }
    this.voices.push(voice); return voice;
  }
  damp(index, held, release = 0.18) {
    if (held) {
      if (this.dampers.has(index)) return;
      this.dampers.add(index);
      this.voices.filter(voice => voice.index === index && voice.end > this.time).forEach(voice => this.retire(voice, release));
    } else this.dampers.delete(index);
  }
  stop() { this.voices.forEach(voice => this.retire(voice)); this.voices = []; }
}
