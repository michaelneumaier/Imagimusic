// State bus (proposal 004 §1): the picture reads only a StateFrame.
// collectState(t, snapshots) consumes PLAIN SNAPSHOTS supplied by the app (never live engine objects) and
// evaluates the pure models at t. It imports only pure modules (model.js helpers, excitation.js, dynamics.js).
//
// Snapshot shapes (all plain data; extra fields are ignored):
//   garden / tine voice: { id, slot, noteHz, velocity, noteOn, end, position, approach,
//                          modes: [{ frequency, amplitude, decay }], fadeAt?, fadeDuration?, fadeFrom? }
//   bellows voice:       { id, slot, noteHz, velocity, noteOn, noteOff|null, bellows (validated block),
//                          stolenAt?, stolenFade? (seconds, default 0.04) }
//   snapshots = { garden?: { voices, dampers? }, tine?: { voices, dampers? }, bellows?: { voices }, sampleRate? }
//
// StateFrame v1 (docs/ARCHITECTURE.md Contract 1):
//   { v: 1, t, voices: VoiceState[], global: { families: [...] }, out: { modeledIntensity, measuredRms: null } }
//   VoiceState carries `slot` (number) and `resonator` ('family/slot') so bindings can select voices[slot=3] or
//   voices[resonator=garden/2]. Modal voices exist from the start of their visible approach to their end.
// `out.modeledIntensity` is a MODELED number (sum of voice levels, soft-clipped), not a measurement; `measuredRms`
// stays null until something actually measures the output.

import { envelope } from './model.js';
import { strikerPose, releaseLevel, APPROACH_SECONDS, DECAY_TAUS } from './excitation.js';
import { voiceDynamics } from './dynamics.js';

export const STATE_VERSION = 1;
const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };

function modalVoice(family, voice, t, dampers) {
  const age = t - voice.noteOn;
  const release = releaseLevel(voice, t);
  const modes = voice.modes.map(mode => ({ energy: age < 0 ? 0 : envelope(age, mode.decay) * mode.amplitude * voice.velocity * release }));
  const level = Math.min(1, modes.reduce((s, m) => s + m.energy, 0) * 3);
  const pose = strikerPose(t, voice.noteOn, voice.approach ?? APPROACH_SECONDS);
  let stage = 'off';
  if (age >= 0 && t < voice.end) stage = voice.fadeAt !== undefined && t >= voice.fadeAt ? 'release' : 'decay';
  else if (age < 0 && pose.visible) stage = 'attack';
  return {
    id: String(voice.id), family, slot: voice.slot, resonator: `${family}/${voice.slot}`,
    noteHz: voice.noteHz, velocity: voice.velocity, noteOn: voice.noteOn, age, stage, level,
    exciter: { kind: 'strike', pos01: voice.position ?? 0.5, contact: pose.contact, reach: pose.reach, visible: pose.visible },
    damper: { pressure: dampers && dampers.includes(voice.slot) ? 1 : 0 },
    modes,
    modules: {},
  };
}

function bellowsVoice(voice, t, sampleRate) {
  const d = voiceDynamics(t, voice, voice.bellows, sampleRate);
  // A stolen voice matches BellowsAudio.steal(): amp and env are FROZEN at the value they had at stolenAt and
  // then ramp linearly to zero; filter, LFO, and source pitch keep following their already-scheduled automation.
  let envLevel = d.env.level, ampLevel = d.amp.level, stolen = false;
  if (voice.stolenAt !== undefined && t >= voice.stolenAt) {
    const frozen = voiceDynamics(voice.stolenAt, voice, voice.bellows, sampleRate);
    const fade = Math.max(0, 1 - (t - voice.stolenAt) / (voice.stolenFade ?? 0.04));
    envLevel = frozen.env.level * fade; ampLevel = frozen.amp.level * fade; stolen = true;
  }
  const age = t - voice.noteOn;
  return {
    id: String(voice.id), family: 'bellows', slot: voice.slot, resonator: `bellows/${voice.slot}`,
    noteHz: voice.noteHz, velocity: voice.velocity, noteOn: voice.noteOn, age,
    stage: stolen ? 'release' : d.env.stage, level: ampLevel,
    exciter: { kind: 'air', pos01: 0, contact: envLevel, fill01: 1 - envLevel },
    damper: { pressure: 0 },
    modules: {
      env: { type: 'env', level: envLevel, stage: stolen ? 'release' : d.env.stage },
      filter: { type: 'filter', cutoffHz: d.filter.cutoffHz, resonance: d.filter.resonance, aperture01: d.filter.aperture01 },
      lfo: { type: 'lfo', value: d.lfo.value, phase01: d.lfo.phase01 },
      source: { type: 'source', kind: d.source.kind, level: envLevel, frequencyHz: d.source.frequencyHz },
      amp: { type: 'amp', level: ampLevel },
    },
  };
}

export function collectState(t, snapshots = {}) {
  finite(t, 't');
  const sampleRate = snapshots.sampleRate ?? 48000;
  const voices = [];
  for (const family of ['garden', 'tine']) {
    const snap = snapshots[family]; if (!snap) continue;
    // A voice exists in the picture from the start of its visible approach until its end; a scheduled note
    // further in the future does not displace what is currently visible (Astra, M2 review fixes).
    for (const voice of snap.voices ?? []) {
      const approach = voice.approach ?? APPROACH_SECONDS;
      if (t >= voice.noteOn - approach && t <= voice.end + 1e-9) voices.push(modalVoice(family, voice, t, snap.dampers));
    }
  }
  // Bellows voices have no visible pre-breath mechanism, so they exist only from noteOn (a scheduled future
  // breath must not overwrite the current occupant of its slot) until release end or steal end.
  if (snapshots.bellows) for (const voice of snapshots.bellows.voices ?? []) {
    const end = voice.stolenAt !== undefined ? voice.stolenAt + (voice.stolenFade ?? 0.04) : voice.noteOff === null || voice.noteOff === undefined ? Infinity : voice.noteOff + voice.bellows.adsr.r;
    if (t >= voice.noteOn && t <= end) voices.push(bellowsVoice(voice, t, sampleRate));
  }
  const sum = voices.reduce((s, v) => s + v.level, 0);
  return {
    v: STATE_VERSION, t, voices,
    global: { families: Object.keys(snapshots).filter(k => ['garden', 'tine', 'bellows'].includes(k)), decayTaus: DECAY_TAUS },
    out: { modeledIntensity: 1 - Math.exp(-sum), measuredRms: null },
  };
}

// Stable hash of a frame for motion-trace regression: numbers rounded to `digits`, keys sorted, FNV-1a 32-bit.
export function traceHash(frame, digits = 4) {
  const seen = [];
  const text = JSON.stringify(frame, (key, value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? Number(value.toFixed(digits)) : String(value);
    if (value && typeof value === 'object' && !Array.isArray(value)) return Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]]));
    return value;
  });
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/** Hash sequence for a list of times: the regression artifact compared live vs offline at identical timestamps. */
export function traceSequence(times, snapshots) { return times.map(t => traceHash(collectState(t, snapshots))); }
