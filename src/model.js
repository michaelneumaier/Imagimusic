// The same modal definition drives audible partials and visible energy.
export const MATERIALS = {
  glass: { ratios: [1, 2.32, 4.25, 6.63, 9.38], color: [156, 229, 215] },
  bronze: { ratios: [1, 1.52, 2.14, 3.67, 5.43], color: [244, 182, 112] },
  string: { ratios: [1, 2, 3, 4, 5], color: [185, 174, 255] },
};
export const NOTES = [48, 51, 55, 58, 60, 63, 67, 70];
export const DEFAULT_PATCH = { version: 1, material: 'glass', damping: 0.38, brightness: 0.6, spread: 0.55, tempo: 84, seed: 731 };
export const frequency = midi => 440 * 2 ** ((midi - 69) / 12);
export function validatePatch(value) {
  if (!value || value.version !== 1 || !Object.hasOwn(MATERIALS, value.material)) throw new Error('Unsupported instrument file.');
  const patch = { version: 1, material: value.material };
  for (const [key, low, high] of [['damping', 0, 1], ['brightness', 0, 1], ['spread', 0, 1], ['tempo', 40, 160], ['seed', 0, 4294967295]]) {
    if (typeof value[key] !== 'number' || !Number.isFinite(value[key]) || value[key] < low || value[key] > high) throw new Error(`Invalid ${key}.`);
    patch[key] = value[key];
  }
  if (!Number.isInteger(patch.seed)) throw new Error('Seed must be an integer.');
  return patch;
}
export function modesFor(midi, patch, sampleRate = 48000) {
  return MATERIALS[patch.material].ratios.map((ratio, i) => ({
    frequency: frequency(midi) * ratio,
    amplitude: 0.19 * (0.12 + patch.brightness * 0.88) ** (i * 0.65) / (1 + i * 0.35),
    decay: (0.22 + (1 - patch.damping) * 3.6) / (1 + i * 0.32),
  })).filter(mode => mode.frequency < sampleRate * 0.45);
}
export function envelope(age, decay) {
  if (age < 0 || age > decay * 9) return 0;
  return Math.min(1, age / 0.004) * Math.exp(-age / decay);
}
export function modeValue(mode, age) {
  return mode.amplitude * envelope(age, mode.decay) * Math.sin(2 * Math.PI * mode.frequency * age);
}
export function random(seed) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
}
export function makeScore(patch, beats = 16) {
  const rng = random(patch.seed);
  const step = 60 / patch.tempo / 2;
  return Array.from({ length: beats * 2 }, (_, i) => ({
    time: i * step,
    index: i % 8 === 0 ? 0 : Math.floor(rng() * NOTES.length),
    velocity: 0.5 + rng() * 0.4,
  }));
}
export function renderSamples(patch, sampleRate = 22050, beats = 16) {
  const score = makeScore(patch, beats);
  const tail = modesFor(NOTES[0], patch, sampleRate)[0].decay * 9;
  const length = Math.ceil((beats * 60 / patch.tempo + tail) * sampleRate);
  const samples = new Float32Array(length);
  for (const event of score) {
    const modes = modesFor(NOTES[event.index], patch, sampleRate);
    const start = Math.round(event.time * sampleRate);
    const end = Math.min(length, start + Math.ceil(tail * sampleRate));
    for (let frame = start; frame < end; frame++) {
      const age = (frame - start) / sampleRate;
      let value = 0;
      for (const mode of modes) value += modeValue(mode, age);
      samples[frame] += value * event.velocity * 0.24;
    }
  }
  for (let i = 0; i < samples.length; i++) samples[i] = Math.max(-0.98, Math.min(0.98, samples[i]));
  return samples;
}
export function encodeWav(samples, sampleRate) {
  const buffer = new ArrayBuffer(44 + samples.length * 2), view = new DataView(buffer);
  const write = (at, text) => [...text].forEach((letter, i) => view.setUint8(at + i, letter.charCodeAt(0)));
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true));
  return buffer;
}
