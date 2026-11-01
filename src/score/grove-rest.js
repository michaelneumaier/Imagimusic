// The Rest recipe for a Grove voice (proposal 017): everything the engine needs, as plain serializable numbers, prepared
// off the audio thread for one sample rate. Exactness claim, stated precisely: between gesture boundaries the model is linear
// and time-invariant, and Φ = exp(S h) advances it exactly at the sample instants, up to the matrix-exponential's truncation
// (Taylor to 24 terms after scaling to ‖·‖₁ ≤ 0.5) and floating-point roundoff; there is no time-stepping approximation.
import { createGroveVoice, voiceSystem, grovePans, DEFAULT_VOICE_CONFIG } from './grove-voice.js';
import { stateStepper, strikeImpulse, contactDamping } from '../coupling.js';
import { REST_RECIPE_VERSION, contactStateKey, createRestEngine, renderRestPassage } from '../rest/engine.js';

/** Two rest strengths, viscous coefficients in N·s/m per unit shape, stated as choices, not measurements of any hand. */
export const REST_STRENGTHS = Object.freeze({ light: 12, firm: 60 });
export const REST_STRENGTH_NAMES = Object.freeze(Object.keys(REST_STRENGTHS));
export const REST_MAX_STATES = 512;

/** Enumerate every combination of (no rest | zone × strength) over the bodies; the first state is "no contact". */
export function enumerateContactStates(bodies, zones, strengths) {
  const options = [null]; for (let z = 0; z < zones; z++) for (let s = 0; s < strengths; s++) options.push({ zone: z, strength: s });
  let states = [[]]; for (let b = 0; b < bodies; b++) states = states.flatMap(prefix => options.map(o => [...prefix, o]));
  if (states.length > REST_MAX_STATES) throw new Error(`${states.length} contact states exceed ${REST_MAX_STATES}; reduce zones or strengths.`);
  return states;
}

/** Build the recipe: transition matrices per contact state, strike vectors per position × body, stereo pickup vectors, gains. */
export function createGroveRestRecipe(grove, config = DEFAULT_VOICE_CONFIG, { sampleRate = 48000, strengths = REST_STRENGTHS, zones } = {}) {
  const voice = createGroveVoice(grove, config), g = voice.grove, c = voice.config;
  const { system } = voiceSystem(g, c), pans = grovePans(g), n = system.n, dim = 2 * n, bodies = g.bodies.length;
  const restZones = zones ?? c.positions; const strengthNames = Object.keys(strengths), strengthValues = strengthNames.map(k => strengths[k]);
  for (const u of restZones) if (!(u >= 0 && u <= 1)) throw new Error('rest zones must be positions in [0, 1].');
  for (const v of strengthValues) if (!(v > 0)) throw new Error('rest strengths must be positive viscous coefficients.');
  const states = enumerateContactStates(bodies, restZones.length, strengthValues.length);
  const contactStates = states.map(perBody => {
    const contacts = perBody.map((o, body) => (o ? { body, u: restZones[o.zone], c: strengthValues[o.strength] } : null)).filter(Boolean);
    return { key: contactStateKey(perBody), contacts, phi: Array.from(stateStepper(system, { contacts, sampleRate }).phi) };
  });
  const strikeVectors = c.positions.map(u => g.bodies.map((_, body) => Array.from(strikeImpulse(system, { body, u, J: 1 }))));
  // Pickup vectors reproduce the bank's stereo mix: output_ch = pickupScale · Σ_b pans[b][ch] · displacement(b, pickupU).
  const pickupVectors = [0, 1].map(ch => { const v = new Array(dim).fill(0); g.bodies.forEach((_, b) => { const w = system.snapshot[b].shape(c.pickupU), o = system.offsets[b]; for (let j = 0; j < system.sizes[b]; j++) v[o + j] += voice.pickupScale * pans[b][ch] * w[j] / Math.sqrt(system.snapshot[b].mass); }); return v; });
  return {
    version: REST_RECIPE_VERSION, kind: 'imagimusic-grove-rest-recipe', sampleRate, n, dim, bodies, channels: 2,
    seed: g.seed, voice: c, positions: c.positions.slice(), zones: restZones.slice(), strengths: strengthNames.map((name, i) => ({ name, c: strengthValues[i] })),
    contactStates, strikeVectors, pickupVectors, outputGain: voice.outputGain, pickupScale: voice.pickupScale, ring: voice.ring, fade: voice.fade,
    stiffness: Array.from({ length: n * n }, (_, i) => system.A[Math.floor(i / n)][i % n]),
    order: 'at frame i: apply strikes due at i to velocity; select the contact state active at i ([start, end)); read pickups as output i; step to i + 1',
    exactness: 'exact linear evolution between gesture boundaries at the sample instants, up to matrix-exponential truncation and floating-point roundoff; no time-stepping approximation; classical damping as in the modal sums; viscous point contact only',
    realism: 'a rest is a viscous damper at one point of one shell with two stated coefficients; no hand mass or stiffness, no nonlinear contact, no pressure sensing; not a measurement of any real hand on any real shell',
  };
}
export { contactDamping };

// ---- capture v2: a Rest record, its validation, canonical form and exact renderer ----
// Events carry the frame they were actually applied at and the actual application order (acknowledged by the audio clock,
// never the requested time); contacts are half-open frame intervals per body that never overlap on one body.
export const REST_RECORD_KIND = 'imagimusic-grove-rest', REST_RECORD_VERSION = 2, REST_MAX_EVENTS = 128, REST_MAX_CONTACTS = 256, REST_MAX_SECONDS = 120;
const keysExactly = (o, keys, name) => { if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(`${name} must be an object.`); const extra = Object.keys(o).filter(k => !keys.includes(k)), missing = keys.filter(k => !(k in o)); if (extra.length || missing.length) throw new Error(`${name}: unexpected keys ${JSON.stringify(extra)}, missing ${JSON.stringify(missing)}.`); };
const frameValue = (v, name) => { if (!Number.isSafeInteger(v) || v < 0) throw new Error(`${name} must be a non-negative integer frame.`); return v; };

/** Validate a Rest record against its recipe (same seed, voice, sample rate, zones and strengths). Returns the record. */
export function validateRestRecord(record, recipe) {
  keysExactly(record, ['version', 'kind', 'seed', 'voice', 'sampleRate', 'outputGain', 'zones', 'strengths', 'events', 'contacts', 'ended'], 'RestRecord');
  if (record.version !== REST_RECORD_VERSION || record.kind !== REST_RECORD_KIND) throw new Error('not a Rest record (version 2).');
  if (record.seed !== recipe.seed || record.sampleRate !== recipe.sampleRate || record.outputGain !== recipe.outputGain) throw new Error('record does not belong to this recipe (seed, sample rate or gain).');
  if (JSON.stringify(record.voice) !== JSON.stringify(recipe.voice) || JSON.stringify(record.zones) !== JSON.stringify(recipe.zones) || JSON.stringify(record.strengths) !== JSON.stringify(recipe.strengths.map(s => s.name))) throw new Error('record voice, zones or strengths differ from the recipe.');
  if (!Array.isArray(record.events) || record.events.length > REST_MAX_EVENTS || !Array.isArray(record.contacts) || record.contacts.length > REST_MAX_CONTACTS) throw new Error('events or contacts out of range.');
  const limit = REST_MAX_SECONDS * recipe.sampleRate; let lastFrame = -1, lastOrder = -1; const orders = new Set();
  for (const [i, e] of record.events.entries()) {
    keysExactly(e, ['frame', 'order', 'body', 'position', 'velocity'], `events[${i}]`);
    frameValue(e.frame, `events[${i}].frame`); if (e.frame > limit) throw new Error(`events[${i}] beyond ${REST_MAX_SECONDS} s.`);
    if (!Number.isSafeInteger(e.order) || e.order < 0 || orders.has(e.order)) throw new Error(`events[${i}].order must be a unique non-negative integer.`); orders.add(e.order);
    if (e.frame < lastFrame || (e.frame === lastFrame && e.order < lastOrder)) throw new Error('events must be sorted by applied frame, then by actual order.'); lastFrame = e.frame; lastOrder = e.order;
    if (!Number.isInteger(e.body) || e.body < 0 || e.body >= recipe.bodies) throw new Error(`events[${i}].body out of range.`);
    if (!Number.isInteger(e.position) || e.position < 0 || e.position >= recipe.positions.length) throw new Error(`events[${i}].position must index the recipe positions.`);
    if (!(Number.isFinite(e.velocity) && e.velocity > 0 && e.velocity <= 1)) throw new Error(`events[${i}].velocity must be in (0, 1].`);
  }
  const perBodyEnd = new Array(recipe.bodies).fill(-1);
  for (const [i, c] of record.contacts.entries()) {
    keysExactly(c, ['body', 'zone', 'strength', 'start', 'end', 'order'], `contacts[${i}]`);
    if (!Number.isInteger(c.body) || c.body < 0 || c.body >= recipe.bodies) throw new Error(`contacts[${i}].body out of range.`);
    if (!Number.isInteger(c.zone) || c.zone < 0 || c.zone >= recipe.zones.length) throw new Error(`contacts[${i}].zone must index the recipe zones.`);
    if (!Number.isInteger(c.strength) || c.strength < 0 || c.strength >= recipe.strengths.length) throw new Error(`contacts[${i}].strength must index the recipe strengths.`);
    frameValue(c.start, `contacts[${i}].start`); frameValue(c.end, `contacts[${i}].end`); if (!(c.end > c.start) || c.end > limit) throw new Error(`contacts[${i}] must be a non-empty interval [start, end) within ${REST_MAX_SECONDS} s.`);
    if (!Number.isSafeInteger(c.order) || c.order < 0 || orders.has(c.order)) throw new Error(`contacts[${i}].order must be unique across events and contacts.`); orders.add(c.order);
    if (c.start < perBodyEnd[c.body]) throw new Error(`contacts[${i}] overlaps an earlier rest on body ${c.body} (sort contacts by start per body).`); perBodyEnd[c.body] = c.end;
  }
  if (record.ended !== null) { keysExactly(record.ended, ['frame', 'fadeFrames'], 'ended'); frameValue(record.ended.frame, 'ended.frame'); if (!Number.isInteger(record.ended.fadeFrames) || record.ended.fadeFrames < 1) throw new Error('ended.fadeFrames must be a positive integer.'); }
  return record;
}
export const canonicalRestRecord = (record, recipe) => JSON.stringify(validateRestRecord(record, recipe), (_, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);

/** Length of the rendered passage in frames: every strike rings for `ring` seconds; the recorded Quiet cuts it, as the bank route does. */
export function restRecordLength(record, recipe) {
  const unit = Math.ceil(recipe.ring * recipe.sampleRate);
  const full = Math.max(0, ...record.events.map(e => e.frame + unit), ...record.contacts.map(c => c.end));
  return record.ended ? Math.min(full, record.ended.frame + record.ended.fadeFrames) : full;
}

/** Exact render of a Rest record through the engine: the model itself, no per-unit truncation; the recorded Quiet fade applied as the bank route applies it. */
export function renderRestRecord(record, recipe) {
  validateRestRecord(record, recipe);
  const frames = restRecordLength(record, recipe), out = renderRestPassage(recipe, { strikes: record.events, contacts: record.contacts, frames });
  if (record.ended) for (const ch of out) for (let i = 0; i < frames; i++) ch[i] *= Math.max(0, Math.min(1, 1 - (i - record.ended.frame) / record.ended.fadeFrames));
  return { sampleRate: recipe.sampleRate, channels: out };
}

/** Checkpointed states so the picture can ask for any frame in any order (decision 004): at most `every` steps from the nearest checkpoint. */
export function restRecordStates(record, recipe, { every = 1024 } = {}) {
  validateRestRecord(record, recipe);
  const frames = restRecordLength(record, recipe), engine = createRestEngine(recipe), checkpoints = [];
  const byFrame = new Map(); for (const k of record.events) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  const advance = (eng, i) => { const due = byFrame.get(i); if (due) for (const k of due) eng.strike(k.position, k.body, k.velocity); eng.setContacts(keyAt(i)); eng.step(); };
  for (let i = 0; i < frames; i++) { if (i % every === 0) checkpoints.push({ frame: i, state: engine.state, key: engine.key }); advance(engine, i); }
  const replay = (frame) => { const c = checkpoints[Math.floor(frame / every)], eng = createRestEngine(recipe); eng.load(c.state, c.key); for (let i = c.frame; i < frame; i++) advance(eng, i); return eng; };
  return { frames, every, checkpoints: checkpoints.length,
    /** Mass-normalized state at the start of `frame` (after all events before it; before the events of `frame` itself). */
    stateAt: frame => { if (!Number.isInteger(frame) || frame < 0 || frame > frames) throw new Error('frame out of range.'); return replay(frame).state; } };
}
