// Bellows Choir control model: the synth-dynamics half of an interpreted instrument.
// Pure, deterministic, time-indexed. No DOM, no audio, no hidden accumulators: every value is a
// function of engine time, so live and offline (render) evaluation agree exactly.
//
// Contract (docs/proposals/002-bellows-choir.md, amended by Astra 2026-11-01; equations in docs/bellows-equations.md)
//   validateBellows(block)                      -> bounded copy, throws on anything out of range
//   validateVoice(voice)                        -> { id, noteHz, velocity, noteOn, noteOff }
//   adsrLevel(t, noteOn, noteOff, adsr)         -> { level 0..1, stage }      piecewise LINEAR
//   lfoValue(t, lfo, phase0 = 0)                -> { value -1..1, phase01 }
//   aperture01(cutoffHz)                        -> 0..1 (20 Hz -> 0, 20 kHz -> 1, log scale)
//   cutoffAt(t, voice, bellows, sampleRate)     -> Hz, clamped to [1, 0.45 * sampleRate]
//   voiceDynamics(t, voice, bellows, sampleRate)-> the VoiceState fragment the picture and the audio adapter read
//   scheduleVoice(voice, bellows, sampleRate, { fromTime, toTime, controlRate = 200 }) -> linear automation segments
//
// `bellows` may be a validated bellows block or a patch carrying one as `patch.bellows`.
// Callers validate once (validateBellows / validateVoice); the scalar helpers only check that time is finite.

export const SOURCES = ['reed', 'saw', 'air'];      // reed = square wave (no pulse-width control yet), saw, air = noise
export const LFO_WAVES = ['sine', 'tri', 'square'];
export const LFO_TARGETS = ['cutoff', 'pitch', 'amp'];
export const MIDDLE_C_HZ = 261.6255653005986;
export const NYQUIST_FRACTION = 0.45;
export const APERTURE_LOW_HZ = 20, APERTURE_HIGH_HZ = 20000;

export const BELLOWS_BOUNDS = {
  cutoffHz: [20, 20000], resonance: [0, 1], envAmount: [-4, 4], keyTrack: [0, 1],
  adsr: { a: [0.001, 4], d: [0.001, 4], s: [0, 1], r: [0.01, 8] },
  lfo: { rateHz: [0.05, 20], depthOct: [0, 2] },
};

export const DEFAULT_BELLOWS = Object.freeze({
  source: 'saw', cutoffHz: 1200, resonance: 0.3, envAmount: 2, keyTrack: 0.5,
  adsr: Object.freeze({ a: 0.02, d: 0.25, s: 0.6, r: 0.4 }),
  lfo: Object.freeze({ wave: 'sine', rateHz: 2.5, depthOct: 0.3, target: 'cutoff' }),
});

const finite = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`${name} must be a finite number.`);
  return value;
};
const positiveFinite = (value, name) => {
  finite(value, name);
  if (value <= 0) throw new Error(`${name} must be positive.`);
  return value;
};
export const MAX_SCHEDULE_POINTS = 200000;   // ~16 min at 200 Hz; guards runaway allocation on malformed calls
const bounded = (value, [low, high], name) => {
  finite(value, name);
  if (value < low || value > high) throw new Error(`${name} must be within [${low}, ${high}].`);
  return value;
};
const oneOf = (value, list, name) => {
  if (!list.includes(value)) throw new Error(`${name} must be one of ${list.join(', ')}.`);
  return value;
};

export function validateBellows(block) {
  if (!block || typeof block !== 'object') throw new Error('bellows block must be an object.');
  if (!block.adsr || typeof block.adsr !== 'object' || !block.lfo || typeof block.lfo !== 'object') throw new Error('bellows needs adsr and lfo blocks.');
  const B = BELLOWS_BOUNDS;
  return {
    source: oneOf(block.source, SOURCES, 'bellows.source'),
    cutoffHz: bounded(block.cutoffHz, B.cutoffHz, 'bellows.cutoffHz'),
    resonance: bounded(block.resonance, B.resonance, 'bellows.resonance'),
    envAmount: bounded(block.envAmount, B.envAmount, 'bellows.envAmount'),
    keyTrack: bounded(block.keyTrack, B.keyTrack, 'bellows.keyTrack'),
    adsr: {
      a: bounded(block.adsr.a, B.adsr.a, 'bellows.adsr.a'), d: bounded(block.adsr.d, B.adsr.d, 'bellows.adsr.d'),
      s: bounded(block.adsr.s, B.adsr.s, 'bellows.adsr.s'), r: bounded(block.adsr.r, B.adsr.r, 'bellows.adsr.r'),
    },
    lfo: {
      wave: oneOf(block.lfo.wave, LFO_WAVES, 'bellows.lfo.wave'),
      rateHz: bounded(block.lfo.rateHz, B.lfo.rateHz, 'bellows.lfo.rateHz'),
      depthOct: bounded(block.lfo.depthOct, B.lfo.depthOct, 'bellows.lfo.depthOct'),
      target: oneOf(block.lfo.target, LFO_TARGETS, 'bellows.lfo.target'),
    },
  };
}

export function validateVoice(voice) {
  if (!voice || typeof voice !== 'object') throw new Error('voice must be an object.');
  const noteHz = finite(voice.noteHz, 'voice.noteHz');
  if (noteHz <= 0) throw new Error('voice.noteHz must be positive.');
  const velocity = bounded(voice.velocity, [0, 1], 'voice.velocity');
  const noteOn = finite(voice.noteOn, 'voice.noteOn');
  if (noteOn < 0) throw new Error('voice.noteOn must be >= 0.');
  let noteOff = null;
  if (voice.noteOff !== null && voice.noteOff !== undefined) {
    noteOff = finite(voice.noteOff, 'voice.noteOff');
    if (noteOff < noteOn) throw new Error('voice.noteOff must be >= voice.noteOn or null.');
  }
  const out = { id: voice.id ?? null, noteHz, velocity, noteOn, noteOff };
  if (voice.seed !== undefined) { if (!Number.isInteger(voice.seed) || voice.seed < 0) throw new Error('voice.seed must be a non-negative integer.'); out.seed = voice.seed; }
  return out;
}

const blockOf = bellows => (bellows && bellows.bellows) ? bellows.bellows : bellows;

// Piecewise-linear ADSR. Attack 0 -> 1 over a; decay 1 -> s over d; sustain s while held;
// release from the level at noteOff -> 0 over r; 'off' afterwards and before noteOn.
export function adsrLevel(t, noteOn, noteOff, adsr) {
  finite(t, 't');
  if (t < noteOn) return { level: 0, stage: 'off' };
  const held = (time) => {
    const age = time - noteOn;
    if (age < adsr.a) return { level: age / adsr.a, stage: 'attack' };
    if (age < adsr.a + adsr.d) return { level: 1 - (1 - adsr.s) * (age - adsr.a) / adsr.d, stage: 'decay' };
    return { level: adsr.s, stage: 'sustain' };
  };
  if (noteOff === null || noteOff === undefined || t < noteOff) return held(t);
  const from = held(noteOff).level;
  const since = t - noteOff;
  if (since >= adsr.r) return { level: 0, stage: 'off' };
  return { level: from * (1 - since / adsr.r), stage: 'release' };
}

export function lfoValue(t, lfo, phase0 = 0) {
  finite(t, 't');
  const phase01 = ((t * lfo.rateHz + phase0) % 1 + 1) % 1;
  let value;
  if (lfo.wave === 'sine') value = Math.sin(2 * Math.PI * phase01);
  else if (lfo.wave === 'tri') value = phase01 < 0.25 ? 4 * phase01 : phase01 < 0.75 ? 2 - 4 * phase01 : 4 * phase01 - 4;
  else value = phase01 < 0.5 ? 1 : -1;   // square: exact step in the model; audio ramps approximate it at the control rate
  return { value, phase01 };
}

export function aperture01(cutoffHz) {
  finite(cutoffHz, 'cutoffHz');
  const v = Math.log2(cutoffHz / APERTURE_LOW_HZ) / Math.log2(APERTURE_HIGH_HZ / APERTURE_LOW_HZ);
  return Math.max(0, Math.min(1, v));
}

const clampHz = (hz, sampleRate) => Math.max(1, Math.min(NYQUIST_FRACTION * sampleRate, hz));

// Exact mappings (also in docs/bellows-equations.md):
//   oct      = lfo.depthOct * lfo.value
//   cutoff   = cutoffHz * 2^(envAmount * env.level) * 2^(oct if target = cutoff) * (noteHz / C4)^keyTrack, clamped
//   freq     = noteHz * 2^(oct if target = pitch), clamped
//   tremolo  = 1 - min(1, depthOct) * (1 - lfo.value) / 2   if target = amp, else 1   (swings between 1 - depth and 1)
//   amp      = env.level * velocity * tremolo
//   source   = env.level (airflow / drive), bellows.fill01 = 1 - env.level (squeezed on attack, relaxed on release)
export function voiceDynamics(t, voice, bellows, sampleRate) {
  const b = blockOf(bellows);
  positiveFinite(sampleRate, 'sampleRate');
  const env = adsrLevel(t, voice.noteOn, voice.noteOff, b.adsr);
  // LFO phase restarts at each note's onset (Astra, 2026-11-01): every breath modulates reproducibly,
  // live and exported scores agree regardless of AudioContext uptime, and each chamber owns its pendulum.
  const lfo = lfoValue(t - voice.noteOn, b.lfo);
  const oct = b.lfo.depthOct * lfo.value;
  const cutoffHz = clampHz(b.cutoffHz * 2 ** (b.envAmount * env.level) * 2 ** (b.lfo.target === 'cutoff' ? oct : 0) * (voice.noteHz / MIDDLE_C_HZ) ** b.keyTrack, sampleRate);
  const frequencyHz = clampHz(voice.noteHz * 2 ** (b.lfo.target === 'pitch' ? oct : 0), sampleRate);
  const tremolo = b.lfo.target === 'amp' ? 1 - Math.min(1, b.lfo.depthOct) * (1 - lfo.value) / 2 : 1;
  const ampLevel = env.level * voice.velocity * tremolo;
  return {
    env,
    lfo,
    filter: { cutoffHz, resonance: b.resonance, aperture01: aperture01(cutoffHz) },
    source: { kind: b.source, level: env.level, frequencyHz },
    amp: { level: ampLevel },
    bellows: { fill01: 1 - env.level },
  };
}

export function cutoffAt(t, voice, bellows, sampleRate) { return voiceDynamics(t, voice, bellows, sampleRate).filter.cutoffHz; }

// Linear automation segments for the audio adapter. Samples the model on a control-rate grid from
// fromTime to toTime and adds the exact envelope boundaries (noteOn, noteOn+a, noteOn+a+d, noteOff,
// noteOff+r) that fall inside the window, so corners are never missed. The first segment is the value
// at fromTime even mid-envelope (rolling windows for held notes). Between samples the adapter ramps
// linearly; for a square LFO the step is exact at sample times and approximated by the ramp between.
export function scheduleVoice(voice, bellows, sampleRate, { fromTime, toTime, controlRate = 200 } = {}) {
  const v = validateVoice(voice);
  const b = validateBellows(blockOf(bellows));
  positiveFinite(sampleRate, 'sampleRate');
  positiveFinite(controlRate, 'controlRate');
  const from = fromTime === undefined ? v.noteOn : finite(fromTime, 'fromTime');
  let to = toTime;
  if (to === undefined) {
    if (v.noteOff === null) throw new Error('toTime is required for a held voice (noteOff = null); schedule it in rolling windows.');
    to = v.noteOff + b.adsr.r;
  } else finite(to, 'toTime');
  if (to < from) throw new Error('toTime must be >= fromTime.');
  const points = (to - from) * controlRate;
  if (!(points <= MAX_SCHEDULE_POINTS)) throw new Error(`schedule span × controlRate = ${points} exceeds MAX_SCHEDULE_POINTS (${MAX_SCHEDULE_POINTS}); use rolling windows.`);
  // Grid anchored to the note onset (not the window start), so rolling live windows and the offline
  // render sample the same lattice: t_k = noteOn + k / controlRate.
  const times = new Set([from, to]);
  const dt = 1 / controlRate;
  const kStart = Math.max(0, Math.ceil((from - v.noteOn) * controlRate - 1e-9));
  for (let k = kStart; ; k++) {
    const tk = v.noteOn + k * dt;
    if (tk >= to) break;
    if (tk > from) times.add(tk);
  }
  const boundaries = [v.noteOn, v.noteOn + b.adsr.a, v.noteOn + b.adsr.a + b.adsr.d];
  if (v.noteOff !== null) boundaries.push(v.noteOff, v.noteOff + b.adsr.r);
  for (const tb of boundaries) if (tb >= from && tb <= to) times.add(tb);
  const sorted = [...times].sort((x, y) => x - y);
  const segments = [];
  for (const t of sorted) {
    const d = voiceDynamics(t, v, b, sampleRate);
    segments.push({ t, param: 'gain', value: d.amp.level, ramp: 'linear' });
    segments.push({ t, param: 'cutoffHz', value: d.filter.cutoffHz, ramp: 'linear' });
    segments.push({ t, param: 'frequencyHz', value: d.source.frequencyHz, ramp: 'linear' });
  }
  return segments;
}
