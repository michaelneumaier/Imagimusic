import { modesFor, envelope, NOTES } from './model.js';
export const MAX_VOICES = 48;
export const STEAL_FADE = 0.06;
export function voiceLevel(voice, time) {
  return voice.fadeAt === undefined ? 1 : Math.max(0, 1 - (time - voice.fadeAt) / STEAL_FADE);
}
export class InstrumentAudio {
  constructor() { this.context = null; this.voices = []; }
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
  retire(voice) {
    const now = this.time;
    voice.fadeAt = now; voice.end = now + STEAL_FADE;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(1, now);
    voice.gain.gain.linearRampToValueAtTime(0, voice.end);
    voice.nodes.forEach(node => node.stop(voice.end));
  }
  strike(index, patch, velocity = 0.8, when = this.time) {
    if (!this.context || !Number.isInteger(index) || index < 0 || index >= NOTES.length || velocity <= 0) return null;
    this.voices = this.voices.filter(voice => voice.end > this.time);
    if (this.voices.length >= MAX_VOICES) this.retire(this.voices.shift());
    const modes = modesFor(NOTES[index], patch, this.context.sampleRate);
    if (!modes.length) return null;
    const voiceGain = this.context.createGain(), pan = this.context.createStereoPanner();
    pan.pan.value = (index / 7 * 2 - 1) * patch.spread;
    voiceGain.connect(pan).connect(this.master);
    const voice = { index, time: when, modes, velocity, end: when + modes[0].decay * 9, nodes: [], gain: voiceGain };
    let remaining = modes.length;
    for (const mode of modes) {
      const oscillator = this.context.createOscillator(), gain = this.context.createGain();
      oscillator.frequency.value = mode.frequency;
      oscillator.connect(gain).connect(voiceGain);
      // Resolve the 4ms attack separately so long decays cannot smear it.
      const attack = new Float32Array(32);
      for (let i = 0; i < attack.length; i++) attack[i] = mode.amplitude * velocity * envelope(i / (attack.length - 1) * 0.004, mode.decay);
      gain.gain.setValueCurveAtTime(attack, when, 0.004);
      gain.gain.exponentialRampToValueAtTime(mode.amplitude * velocity * Math.exp(-9), when + mode.decay * 9);
      oscillator.start(when); oscillator.stop(when + mode.decay * 9);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); if (--remaining === 0) { voiceGain.disconnect(); pan.disconnect(); } };
      voice.nodes.push(oscillator);
    }
    this.voices.push(voice); return voice;
  }
  stop() { this.voices.forEach(voice => this.retire(voice)); this.voices = []; }
}
