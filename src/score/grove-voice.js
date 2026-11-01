// Grove voice factory (proposal 015c): ONE pure recipe for the richer voice, shared by the comparison tool and the runtime.
// A voice is a grove (v1, canonical, untouched) plus a serializable voice configuration: beam family, number of partials,
// attachment and pickup positions, and a small explicit vocabulary of strike positions. The factory returns frozen,
// sample-rate-independent modal data: for every (strike position, struck body) the signed pickup modes at every body and
// the stereo modes per channel, all at the normal frequencies of ONE modalNetwork, with ONE pickup scale over every
// position × struck body × pickup and ONE output gain from the worst unit stereo bound over all of them, so moving the
// strike position never renormalizes history. A runtime buffer index for (position p, struck body b) is p · bodies + b.
// Memory: positions × bodies × channels × modes numbers (3·3·2·9 = 162 here),
// not cached PCM; a runtime may synthesize or cache unit buffers from these modes as it likes.
// With partials: 1 and positions: [1] (attachment at the tip, unit shape) the voice is exactly today's Grove (tested).

import { modalNetwork } from '../coupling.js';
import { modesOf, GEOMETRY_MATERIALS } from '../geometry.js';
import { validateGrove, canonicalGrove, groveRingSeconds } from './grove.js';

export const VOICE_VERSION = 1;
export const VOICE_FAMILIES = Object.freeze(['clamped-free']);
export const DEFAULT_VOICE_CONFIG = Object.freeze({ version: VOICE_VERSION, family: 'clamped-free', partials: 3, attachU: 1, pickupU: 1, positions: Object.freeze([0.3, 0.6, 1]) });   // reconciled with Astra 062221Z: the lower bound, the measured default, the tip
export const VOICE_BOUNDS = Object.freeze({ partials: [1, 4], positions: [1, 5], positionRange: [0.3, 1] });   // below 0.3 the clamped-free shapes vanish: a touch there would be nearly silent at any force
export const PICKUP_LEVEL = 0.19, GAIN_CEILING = 0.45, LOW_BAND_FACTOR = 1.5;

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };
const deepFreeze = v => { if (v && typeof v === 'object' && !Object.isFrozen(v)) { Object.freeze(v); for (const k of Object.keys(v)) deepFreeze(v[k]); } return v; };

/** Strict validation of a voice configuration; returns it. */
export function validateVoiceConfig(c) {
  keysExactly(c, ['version', 'family', 'partials', 'attachU', 'pickupU', 'positions'], 'VoiceConfig');
  if (c.version !== VOICE_VERSION) throw new Error(`VoiceConfig version must be ${VOICE_VERSION}.`);
  if (!VOICE_FAMILIES.includes(c.family)) throw new Error(`family must be one of ${VOICE_FAMILIES.join(', ')}.`);
  if (!Number.isInteger(c.partials) || c.partials < VOICE_BOUNDS.partials[0] || c.partials > VOICE_BOUNDS.partials[1]) throw new Error(`partials must be an integer in ${VOICE_BOUNDS.partials.join('..')}.`);
  for (const k of ['attachU', 'pickupU']) { finite(c[k], k); if (c[k] < 0 || c[k] > 1) throw new Error(`${k} must be within [0, 1].`); }
  if (!Array.isArray(c.positions) || c.positions.length < VOICE_BOUNDS.positions[0] || c.positions.length > VOICE_BOUNDS.positions[1]) throw new Error(`positions must hold ${VOICE_BOUNDS.positions.join('..')} strike positions.`);
  c.positions.forEach((u, i) => { finite(u, `positions[${i}]`); if (u < VOICE_BOUNDS.positionRange[0] || u > VOICE_BOUNDS.positionRange[1]) throw new Error(`positions[${i}] must be within [${VOICE_BOUNDS.positionRange.join(', ')}].`); if (i && u <= c.positions[i - 1]) throw new Error('positions must be strictly increasing.'); });
  return c;
}
export function canonicalVoiceConfig(c) { const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v; return JSON.stringify(sort(validateVoiceConfig(c))); }

/** The partial family for one body: frequencies by the family's ratios from the body's tuning, decay rates ∝ frequency anchored to the grove loss, shapes from geometry.js. */
function partialFamily(config) {
  const set = modesOf({ kind: 'beam', support: 'clamped-free', material: GEOMETRY_MATERIALS.steel, lengthM: 0.065, thicknessM: 0.001, widthM: 0.01 }, { count: config.partials });
  const ratios = set.freqsHz.map(f => f / set.freqsHz[0]), tip = set.weightsAt(config.attachU)[0];
  return { ratios, shape: u => set.weightsAt(u), attachFundamental: tip, formula: set.meta.formula };
}

/** Equal-power stereo pans from normalized layout.x, scaled 1/√N (the Grove's stated pickup convention, not radiation). */
export const grovePans = grove => grove.layout.map(({ x }) => [Math.cos((x + 1) * Math.PI / 4) / Math.sqrt(grove.bodies.length), Math.sin((x + 1) * Math.PI / 4) / Math.sqrt(grove.bodies.length)]);

/** Build the voice. Pure; returns deep-frozen data; no sample rate anywhere. */
export function createGroveVoice(grove, config = DEFAULT_VOICE_CONFIG) {
  const g = JSON.parse(canonicalGrove(grove)), c = JSON.parse(canonicalVoiceConfig(config)), n = g.bodies.length;
  const family = partialFamily(c);
  const bodies = g.bodies.map(b => ({ mass: b.mass, frequencies: family.ratios.map(r => b.hz * r), decayRates: family.ratios.map(r => g.loss * r), shape: family.shape }));
  // Bridge stiffness exactly as groveSystem states it (coupling · m_a · ω_a²), divided by the attachment shape squared so partials: 1 reproduces today's Grove.
  const edges = g.bridges.map(e => ({ a: e.a, b: e.b, kc: e.coupling * g.bodies[e.a].mass * (2 * Math.PI * g.bodies[e.a].hz) ** 2 / (family.attachFundamental * family.attachFundamental), ua: c.attachU, ub: c.attachU }));
  const system = modalNetwork({ bodies, edges }), pans = grovePans(g);
  const strikes = c.positions.map(u => g.bodies.map((_, b) => system.strike(b, u, 1)));
  // One pickup scale over every position × struck body × pickup body.
  let peak = 1e-300;
  for (const row of strikes) for (const strike of row) for (let i = 0; i < n; i++) for (const m of strike.bodyModes(i, c.pickupU)) peak = Math.max(peak, Math.abs(m.amplitude));
  const pickupScale = PICKUP_LEVEL / peak;
  const pickupModes = strikes.map(row => row.map(strike => g.bodies.map((_, i) => strike.bodyModes(i, c.pickupU).map(m => ({ frequency: m.frequency, amplitude: pickupScale * m.amplitude, decay: m.decay })))));
  const stereoModes = pickupModes.map(row => row.map(perBody => [0, 1].map(ch => system.normalFreqsHz.map((frequency, r) => ({ frequency, amplitude: perBody.reduce((sum, modes, i) => sum + modes[r].amplitude * pans[i][ch], 0), decay: 1 / system.gammas[r] })))));
  const worstUnitStereoBound = Math.max(...stereoModes.flat(2).map(ch => ch.reduce((s, m) => s + Math.abs(m.amplitude), 0)));
  const outputGain = GAIN_CEILING / Math.max(1, worstUnitStereoBound);
  const minBase = Math.min(...g.bodies.map(b => b.hz)), lowBandIndex = system.normalFreqsHz.map((f, r) => (f < LOW_BAND_FACTOR * minBase ? r : -1)).filter(r => r >= 0);
  return deepFreeze({
    version: VOICE_VERSION, grove: g, config: c, positions: c.positions.slice(), normalFreqsHz: system.normalFreqsHz.slice(), gammas: system.gammas.slice(), lowBandIndex,
    participationByBody: system.participationByBody.map(p => p.slice()), pans, pickupScale, pickupModes, stereoModes, worstUnitStereoBound, outputGain, ring: groveRingSeconds(g), fade: 0.25,
    dampingResidual: system.dampingResidual, damping: system.damping, family: { name: c.family, ratios: family.ratios.slice(), formula: family.formula },
    interpretation: 'Lumped bodies with beam partials coupled through attachment-point shapes; signed displacement pickups at pickupU; equal-power stereo from layout x; one pickup scale and one output gain over every strike position and body; decay per coupled mode by a classical-damping approximation; not acoustic radiation or shell acoustics.',
  });
}

/** Low-band coherent envelope per body for superposed strikes [{ time, body, position (index), velocity }], the quantity the picture draws (the Grove's own envelope convention). */
/** Runtime buffer slot for a (position index, struck body) pair: one unit response per slot, bodies-major within a position. */
export const voiceBufferIndex = (voice, position, body) => { if (!Number.isInteger(position) || position < 0 || position >= voice.positions.length || !Number.isInteger(body) || body < 0 || body >= voice.grove.bodies.length) throw new Error('position and body must index the voice.'); return position * voice.grove.bodies.length + body; };
export function groveVoiceEnvelope(voice, strikes, t) {
  const n = voice.grove.bodies.length, base = voice.normalFreqsHz[voice.lowBandIndex[0]], re = new Array(n).fill(0), im = new Array(n).fill(0);
  for (const s of strikes) {
    const age = t - s.time; if (age < 0) continue;
    const level = s.velocity * (age >= voice.ring ? 0 : Math.min(1, (voice.ring - age) / voice.fade)); if (!level) continue;
    if (!Number.isInteger(s.position) || s.position < 0 || s.position >= voice.positions.length) throw new Error('strike position must be an index into the voice positions.');
    for (let i = 0; i < n; i++) for (const r of voice.lowBandIndex) {
      const m = voice.pickupModes[s.position][s.body][i][r], amp = level * m.amplitude * Math.exp(-age / m.decay), angle = 2 * Math.PI * m.frequency * age - 2 * Math.PI * base * t;
      re[i] += amp * Math.cos(angle); im[i] += amp * Math.sin(angle);
    }
  }
  return re.map((x, i) => Math.hypot(x, im[i]));
}
