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
export const VOICE_BOUNDS = Object.freeze({ partials: Object.freeze([1, 4]), positions: Object.freeze([1, 5]), positionRange: Object.freeze([0.3, 1]) });   // below 0.3 the clamped-free shapes vanish: a touch there would be nearly silent at any force
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
  // A bridge attached where the fundamental shape vanishes could not couple the fundamentals at all (and the normalization would divide by zero): reject it as a configuration error.
  if (!(Math.abs(tip) > 1e-3)) throw new Error(`attachU = ${config.attachU} is a node of the fundamental shape (|φ₁| = ${Math.abs(tip).toExponential(2)}); the bridge could not couple the bodies there. Use attachU ≥ 0.3.`);
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

// ---- a position-aware greeting for the richer voice (proposal 015, "teach positional contrast by listening") ----
// Shape: one body, three places (upper → middle → bridge tip, each heard twice so the ear can compare) → the neighbor answers at the
// bridge tip and the first body replies at the same place (one color across the bridge) → the third body enters at the upper
// position (the other color, late) → one shared middle touch → silence. No words are needed: the contrast is the lesson.
import { groveNeighbors, groveRingSeconds as ringOf } from './grove.js';
export const VOICE_GREETING_BOUNDS = Object.freeze({ minSeconds: 15, maxSeconds: 35 });
const VOICE_ROLES = Object.freeze({ place: 0.6, answer: 0.55, reply: 0.5, late: 0.5, shared: 0.6 });

/** Compose the greeting for a grove under a voice configuration (positions are indices into config.positions; needs ≥ 3 positions). */
export function composeGroveVoiceGreeting(grove, config = DEFAULT_VOICE_CONFIG, { tempo = 84, lead = 0.35 } = {}) {
  const voice = createGroveVoice(grove, config), g = voice.grove;
  if (voice.positions.length < 3) throw new Error('the position-aware greeting needs at least three strike positions.');
  const upper = 0, middle = 1, tip = voice.positions.length - 1, { neighbor, third } = groveNeighbors(g);
  const s = (id, beat, body, position, role) => ({ id, beat, body, position, velocity: VOICE_ROLES[role], role });
  const strikes = [
    // Places [0, 9): the same body, each place twice.
    s('places:1', 0, 0, upper, 'place'), s('places:2', 1.5, 0, upper, 'place'), s('places:3', 3, 0, middle, 'place'), s('places:4', 4.5, 0, middle, 'place'), s('places:5', 6, 0, tip, 'place'), s('places:6', 7.5, 0, tip, 'place'),
    // Answer [9, 15): the neighbor answers at the bridge tip; the first body replies at the same place.
    s('answer:1', 10.5, neighbor, tip, 'answer'), s('answer:2', 12, 0, tip, 'reply'), s('answer:3', 13.5, neighbor, tip, 'answer'),
    // Late [15, 20): the third body arrives at the upper place, the other color; a reply at the middle.
    s('late:1', 16.5, third, upper, 'late'), s('late:2', 18, 0, middle, 'reply'), s('late:3', 19, third, upper, 'late'),
    // Shared [20, 21): all three at the middle. Silence after.
    s('shared:1', 20, 0, middle, 'shared'), s('shared:2', 20, neighbor, middle, 'shared'), s('shared:3', 20, third, middle, 'shared'),
  ];
  const ringBeats = Math.ceil(ringOf(g) * tempo / 60);
  return validateGroveVoiceGreeting({ version: 1, seed: g.seed, voice: JSON.parse(canonicalVoiceConfig(voice.config)), tempo, lead, neighbor, third,
    sections: [{ id: 'places', beats: [0, 9] }, { id: 'answer', beats: [9, 15] }, { id: 'late', beats: [15, 20] }, { id: 'shared', beats: [20, 21] }, { id: 'silence', beats: [21, 21 + ringBeats] }], strikes }, grove);
}
export const voiceGreetingBeatSeconds = (greeting, beat) => greeting.lead + beat * 60 / greeting.tempo;
export const voiceGreetingDuration = (greeting, grove) => voiceGreetingBeatSeconds(greeting, Math.max(...greeting.strikes.map(k => k.beat))) + ringOf(JSON.parse(canonicalGrove(grove)));
/** The runtime's sequence: [{ time, body, position, velocity }] with position as an index into the voice positions. */
export const voiceGreetingStrikes = greeting => greeting.strikes.map(k => ({ time: voiceGreetingBeatSeconds(greeting, k.beat), body: k.body, position: k.position, velocity: k.velocity }));

/** The promise, checked: the places section uses body 0 only and visits every position in ascending order before any other body sounds;
 *  the neighbor answers before the third body; the shared touch strikes all three; nothing in the silence; 15–35 s. */
export function validateGroveVoiceGreeting(greeting, grove) {
  const g = JSON.parse(canonicalGrove(grove));
  keysExactly(greeting, ['version', 'seed', 'voice', 'tempo', 'lead', 'neighbor', 'third', 'sections', 'strikes'], 'GroveVoiceGreeting');
  if (greeting.version !== 1 || greeting.seed !== g.seed) throw new Error('greeting must belong to this grove.');
  const config = validateVoiceConfig(greeting.voice);
  if (!Number.isInteger(greeting.tempo) || greeting.tempo < 40 || greeting.tempo > 160) throw new Error('tempo must be an integer in 40..160.');
  finite(greeting.lead, 'lead'); if (greeting.lead < 0 || greeting.lead > 5) throw new Error('lead must be within 0..5 s.');
  const { neighbor, third } = groveNeighbors(g);
  if (greeting.neighbor !== neighbor || greeting.third !== third) throw new Error('neighbor and third must follow the grove\'s bridges.');
  let cursor = 0; const ids = ['places', 'answer', 'late', 'shared', 'silence'];
  if (!Array.isArray(greeting.sections) || greeting.sections.map(s => s.id).join() !== ids.join()) throw new Error('sections must be places, answer, late, shared, silence.');
  for (const s of greeting.sections) { keysExactly(s, ['id', 'beats'], `section ${s.id}`); if (!Array.isArray(s.beats) || s.beats.length !== 2 || s.beats[0] !== cursor || !(finite(s.beats[1], 'end') > cursor)) throw new Error(`section ${s.id}: beats must be exactly [start, end), contiguous.`); cursor = s.beats[1]; }
  const section = beat => greeting.sections.find(s => beat >= s.beats[0] && beat < s.beats[1]);
  const seen = new Set(); let last = -Infinity; const placesVisited = [];
  for (const k of greeting.strikes) {
    keysExactly(k, ['id', 'beat', 'body', 'position', 'velocity', 'role'], `strike ${k.id}`);
    if (typeof k.id !== 'string' || seen.has(k.id)) throw new Error('strike ids must be unique strings.'); seen.add(k.id);
    if (!(finite(k.beat, 'beat') >= 0) || k.beat < last) throw new Error('strikes must be sorted by beat.'); last = k.beat;
    if (!Number.isInteger(k.body) || k.body < 0 || k.body >= g.bodies.length) throw new Error('body out of range.');
    if (!Number.isInteger(k.position) || k.position < 0 || k.position >= config.positions.length) throw new Error('position must index the voice positions.');
    if (!(finite(k.velocity, 'velocity') > 0 && k.velocity <= 1) || !Object.hasOwn(VOICE_ROLES, k.role)) throw new Error('velocity in (0, 1] and a known role.');
    const sec = section(k.beat); if (!sec) throw new Error(`strike ${k.id} outside the sections.`);
    if (sec.id === 'places') { if (k.body !== 0) throw new Error('the places section touches body 0 only.'); if (placesVisited.length && k.position < placesVisited.at(-1)) throw new Error('the places section visits positions in ascending order.'); placesVisited.push(k.position); }
    if (sec.id === 'silence') throw new Error('nothing is touched in the silence.');
  }
  if (new Set(placesVisited).size !== config.positions.length) throw new Error('the places section must visit every strike position on body 0 before another body sounds.');
  const firstNeighbor = greeting.strikes.find(k => k.body === neighbor), firstThird = greeting.strikes.find(k => k.body === third);
  if (!firstNeighbor || !firstThird || !(firstThird.beat > firstNeighbor.beat)) throw new Error('the neighbor answers before the third body arrives.');
  const sharedBeat = greeting.sections[3].beats[0], shared = greeting.strikes.filter(k => k.beat === sharedBeat);
  if (new Set(shared.map(k => k.body)).size !== g.bodies.length) throw new Error('the shared touch strikes all three bodies at once.');
  const d = voiceGreetingDuration(greeting, g);
  if (d < VOICE_GREETING_BOUNDS.minSeconds || d > VOICE_GREETING_BOUNDS.maxSeconds) throw new Error(`greeting lasts ${d.toFixed(1)} s; bound is ${VOICE_GREETING_BOUNDS.minSeconds}..${VOICE_GREETING_BOUNDS.maxSeconds} s.`);
  return greeting;
}
