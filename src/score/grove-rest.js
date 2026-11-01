// The Rest recipe for a Grove voice (proposal 017): everything the engine needs, as plain serializable numbers, prepared
// off the audio thread for one sample rate. Exactness claim, stated precisely: between gesture boundaries the model is linear
// and time-invariant, and Φ = exp(S h) advances it exactly at the sample instants, up to the matrix-exponential's truncation
// (Taylor to 24 terms after scaling to ‖·‖₁ ≤ 0.5) and floating-point roundoff; there is no time-stepping approximation.
import { createGroveVoice, voiceSystem, grovePans, DEFAULT_VOICE_CONFIG } from './grove-voice.js';
import { stateStepper, strikeImpulse, contactDamping } from '../coupling.js';
import { REST_RECIPE_VERSION, contactStateKey, createRestEngine, renderRestPassage, visualFromState } from '../rest/engine.js';
import { REST_MAX_EVENTS, REST_MAX_CONTACTS, REST_MAX_SECONDS, REST_QUIET_FADE_SECONDS } from '../rest/limits.js';

/** Two rest strengths, viscous coefficients in N·s/m per unit shape, stated as choices, not measurements of any hand. */
export const REST_STRENGTHS = Object.freeze({ light: 12, firm: 60 });
export const REST_STRENGTH_NAMES = Object.freeze(Object.keys(REST_STRENGTHS));
export const REST_MAX_STATES = 512;
/** Peak ceiling for admission of a strike under the energy bound (a rigorous bound, so no extra margin is hidden elsewhere). */
export const REST_ADMISSION_CEILING = 0.9;

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
  // Admission invariant (Astra, 071803Z): for the positive-definite mass-normalized stiffness A, |p·y| ≤ √(p·A⁻¹p) · √(y·Ay) ≤ √(p·A⁻¹p) · √(2E)
  // by Cauchy–Schwarz in the A-norm, and E never increases while only damping acts (free or any contact). So after a strike, every future
  // output sample until the next strike is bounded by outputGain · √(2E) · f_ch; p·A⁻¹p = Σ_r (v_r·p)² / λ_r from the eigenbasis.
  const energyFactors = pickupVectors.map(p => Math.sqrt(system.vectors.reduce((sum, v, r) => { let d = 0; for (let i = 0; i < n; i++) d += v[i] * p[i]; return sum + d * d / system.lambda[r]; }, 0)));
  // Visual projection data: the low-band coherent envelope per body at the pickup, the same quantity groveVoiceEnvelope draws,
  // but from a state: envelope_i = |Σ_{r∈lowBand} c_{r,i} · A_r| with A_r = (q̇_r + γ_r q_r)/ω_r + i·q_r the mode's analytic amplitude.
  const visual = { lowBand: voice.lowBandIndex.slice(), omegaD: system.omegaD.slice(), gammas: system.gammas.slice(), modeVectors: system.vectors.map(v => v.slice()),
    pickupByMode: system.vectors.map(v => g.bodies.map((_, b) => { const w = system.snapshot[b].shape(c.pickupU), o = system.offsets[b]; let d = 0; for (let j = 0; j < system.sizes[b]; j++) d += w[j] * v[o + j]; return voice.pickupScale * d / Math.sqrt(system.snapshot[b].mass); })),
    interpretation: 'low-band coherent displacement envelope at the pickup per body, from the state; identical to the bank route picture with no rests; not loudness, not radiation',
    snapshot: 'a state snapshot posted after a block describes the start of frame currentFrame + blockLength (after the last step of the block)' };
  return {
    version: REST_RECIPE_VERSION, kind: 'imagimusic-grove-rest-recipe', visual, sampleRate, n, dim, bodies, channels: 2, energyFactors, admissionCeiling: REST_ADMISSION_CEILING,
    seed: g.seed, grove: g, voice: c, positions: c.positions.slice(), zones: restZones.slice(), strengths: strengthNames.map((name, i) => ({ name, c: strengthValues[i] })),
    contactStates, strikeVectors, pickupVectors, outputGain: voice.outputGain, pickupScale: voice.pickupScale, ring: voice.ring, fade: voice.fade,
    stiffness: Array.from({ length: n * n }, (_, i) => system.A[Math.floor(i / n)][i % n]),
    order: 'at frame i: apply strikes due at i to velocity; select the contact state active at i ([start, end)); read pickups as output i; step to i + 1',
    quiet: 'Quiet at frame F with fadeFrames N: contacts in force end at F, no gesture is accepted after F (same frame, later order included), output continues for N frames with the linear fade (1 − (i − F)/N) applied to the Float32-rounded sample, exactly as renderRestRecord does: round to Float32 first, then multiply by the fade',
    admission: 'a strike is admitted iff outputGain · √(2·E_after) · max(energyFactors) ≤ admissionCeiling, where E_after = E + ẏ·Δ + ½|Δ|² for the velocity impulse Δ; this bounds every later output sample while only damping (free or any contact) acts; the free bank bound is not valid under contacts (measured violation up to 1.25× on seed 11) and is not used',
    exactness: 'exact linear evolution between gesture boundaries at the sample instants, up to matrix-exponential truncation and floating-point roundoff; no time-stepping approximation; classical damping as in the modal sums; viscous point contact only',
    realism: 'a rest is a viscous damper at one point of one shell with two stated coefficients; no hand mass or stiffness, no nonlinear contact, no pressure sensing; not a measurement of any real hand on any real shell',
  };
}
export { contactDamping };

// ---- capture v2: a Rest record, its validation, canonical form and exact renderer ----
// Events carry the frame they were actually applied at and the actual application order (acknowledged by the audio clock,
// never the requested time); contacts are half-open frame intervals per body that never overlap on one body.
export const REST_RECORD_KIND = 'imagimusic-grove-rest', REST_RECORD_VERSION = 2;
export { REST_MAX_EVENTS, REST_MAX_CONTACTS, REST_MAX_SECONDS, REST_QUIET_FADE_SECONDS } from '../rest/limits.js';
const keysExactly = (o, keys, name) => { if (!o || typeof o !== 'object' || Array.isArray(o)) throw new Error(`${name} must be an object.`); const extra = Object.keys(o).filter(k => !keys.includes(k)), missing = keys.filter(k => !(k in o)); if (extra.length || missing.length) throw new Error(`${name}: unexpected keys ${JSON.stringify(extra)}, missing ${JSON.stringify(missing)}.`); };
/** Key-sorted JSON so that comparisons do not depend on key order (a canonical record round-trips through its own JSON). */
const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const frameValue = (v, name) => { if (!Number.isSafeInteger(v) || v < 0) throw new Error(`${name} must be a non-negative integer frame.`); return v; };

/** Validate a Rest record against its recipe (same seed, voice, sample rate, zones and strengths). Returns the record. */
export function validateRestRecord(record, recipe) {
  keysExactly(record, ['version', 'kind', 'grove', 'voice', 'sampleRate', 'outputGain', 'zones', 'strengths', 'events', 'contacts', 'ended'], 'RestRecord');
  if (record.version !== REST_RECORD_VERSION || record.kind !== REST_RECORD_KIND) throw new Error('not a Rest record (version 2).');
  if (record.sampleRate !== recipe.sampleRate || record.outputGain !== recipe.outputGain) throw new Error('record does not belong to this recipe (sample rate or gain).');
  // The full canonical grove, not just its seed: the same seed under a changed generator or a custom grove is a different instrument.
  if (stable(record.grove) !== stable(recipe.grove)) throw new Error('record grove differs from the recipe grove (compare canonical groves, not seeds).');
  // Strengths: either [{ name, c }] (names and coefficients, required for any non-default coefficient) or the bare default names, which by
  // contract mean exactly REST_STRENGTHS; a custom coefficient under a default name is therefore never silently accepted.
  if (!Array.isArray(record.strengths) || !record.strengths.length) throw new Error('record strengths must be a non-empty list.');
  const namesOnly = record.strengths.every(st => typeof st === 'string');
  if (namesOnly) { if (stable(record.strengths) !== stable(recipe.strengths.map(st => st.name)) || recipe.strengths.some(st => REST_STRENGTHS[st.name] !== st.c)) throw new Error('record strengths given by name only must be the default strengths with the default coefficients; record [{ name, c }] for custom coefficients.'); }
  else { if (record.strengths.some(st => !st || typeof st.name !== 'string' || !(Number.isFinite(st.c) && st.c > 0))) throw new Error('record strengths must be [{ name, c }] with positive coefficients.'); if (stable(record.strengths) !== stable(recipe.strengths)) throw new Error('record strengths differ from the recipe.'); }
  if (stable(record.voice) !== stable(recipe.voice) || stable(record.zones) !== stable(recipe.zones)) throw new Error('record voice or zones differ from the recipe.');
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
  if (record.ended !== null) {
    keysExactly(record.ended, ['frame', 'fadeFrames'], 'ended'); frameValue(record.ended.frame, 'ended.frame'); if (!Number.isInteger(record.ended.fadeFrames) || record.ended.fadeFrames < 1) throw new Error('ended.fadeFrames must be a positive integer.');
    // Quiet closes the passage: nothing is accepted after it, and every rest ends at or before the Quiet frame (the hands are released there).
    if (record.events.some(e => e.frame > record.ended.frame) || record.contacts.some(c => c.end > record.ended.frame)) throw new Error('no gesture after Quiet: events must be at or before ended.frame and contacts must end by it.');
  }
  return record;
}
export const canonicalRestRecord = (record, recipe) => stable(validateRestRecord(record, recipe));

/** Length of the rendered passage in frames. With Quiet it is exactly ended.frame + fadeFrames, where the worklet stops (the exact model
 *  has no per-unit truncation, so nothing else defines an end). Without Quiet, an unfinished record renders until the last strike has
 *  rung for `ring` seconds or the last rest has ended. */
export function restRecordLength(record, recipe) {
  if (record.ended) return record.ended.frame + record.ended.fadeFrames;
  const unit = Math.ceil(recipe.ring * recipe.sampleRate);
  return Math.max(0, ...record.events.map(e => e.frame + unit), ...record.contacts.map(c => c.end));
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
  // A frame at or past the last checkpoint (including frame === frames when frames is a multiple of `every`) replays from the last one.
  const replay = (frame) => { const eng = createRestEngine(recipe); if (!checkpoints.length) return eng; const c = checkpoints[Math.min(checkpoints.length - 1, Math.floor(frame / every))]; eng.load(c.state, c.key); for (let i = c.frame; i < frame; i++) advance(eng, i); return eng; };
  return { frames, every, checkpoints: checkpoints.length,
    /** Mass-normalized state at the start of `frame` (after all events before it; before the events of `frame` itself). */
    stateAt: frame => { if (!Number.isInteger(frame) || frame < 0 || frame > frames) throw new Error('frame out of range.'); return replay(frame).state; } };
}

/** The picture of a Rest record at any time, in any order (checkpointed): the same fields the voice session's visual gives, plus contacts. */
export function restRecordVisual(record, recipe, { every = 1024 } = {}) {
  const states = restRecordStates(record, recipe, { every }), sr = recipe.sampleRate;
  return { frames: states.frames, visual(time) {
    if (!Number.isFinite(time) || time < 0) throw new Error('Invalid visual time');
    const frame = Math.min(states.frames, Math.floor(time * sr));
    const key = contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= frame && frame < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
    const v = visualFromState(recipe, states.stateAt(frame), key);
    const fade = record.ended ? Math.max(0, Math.min(1, 1 - (frame - record.ended.frame) / record.ended.fadeFrames)) : 1;
    return { time, envelope: v.envelope.map(x => x * fade), lowBand: true, contacts: v.contacts, strikes: fade ? record.events.filter(e => frame >= e.frame && frame < e.frame + 0.3 * sr).map(e => ({ ...e, strikeU: recipe.positions[e.position], age: (frame - e.frame) / sr })) : [] };
  } };
}

// ---- the Rest invitation: a short authored passage that teaches the gesture by listening ----
// Strike a shell and let it ring. Strike it again and rest a hand on it: the ring dies under the hand. Lift. Strike it again and rest on
// the neighbour instead: the bridge carries the change. Then all three at the middle, and Quiet. Commands in the worklet's shape.
export const REST_INVITATION_BOUNDS = Object.freeze({ minSeconds: 12, maxSeconds: 30 });
export function composeRestInvitation(recipe, { tempo = 72 } = {}) {
  if (!Number.isInteger(tempo) || tempo < 40 || tempo > 160) throw new Error('tempo must be an integer in 40..160.');
  const sr = recipe.sampleRate, beat = b => Math.round(b * 60 / tempo * sr), firm = recipe.strengths.findIndex(s => s.name === 'firm'), light = recipe.strengths.findIndex(s => s.name === 'light');
  if (firm < 0 || light < 0 || recipe.zones.length < 3) throw new Error('the invitation is written for three zones and the light and firm strengths.');
  const tip = recipe.zones.length - 1, middle = 1, g = recipe.grove, neighbor = g.bridges.find(e => e.a === 0 || e.b === 0), other = neighbor.a === 0 ? neighbor.b : neighbor.a, third = [0, 1, 2].find(b => b !== 0 && b !== other);
  const id = (() => { let n = 0; return () => `invite-${n++}`; })();
  const strike = (b, body, position, velocity) => ({ id: id(), kind: 'strike', frame: beat(b), body, position, velocity });
  const rest = (b, body, zone, strength) => ({ id: id(), kind: 'contact', frame: beat(b), body, zone, strength });
  const lift = (b, body) => ({ id: id(), kind: 'contact', frame: beat(b), body, zone: null });
  const commands = [
    strike(0, 0, middle, 0.6),                                       // ring
    strike(4, 0, middle, 0.6), rest(5, 0, tip, firm), lift(8, 0),    // rest on it: the ring dies under the hand
    strike(10, 0, middle, 0.6), rest(11, other, tip, firm), lift(14, other),   // rest on the neighbour: the bridge carries the change
    strike(16, 0, middle, 0.5), strike(16, other, middle, 0.5), strike(16, third, middle, 0.5), rest(17.5, 0, middle, light), lift(20, 0),   // all three, a light hand
    { id: id(), kind: 'quiet', frame: beat(24), fadeFrames: Math.round(REST_QUIET_FADE_SECONDS * sr) },
  ];
  const sections = [{ id: 'ring', beats: [0, 4] }, { id: 'rest', beats: [4, 10] }, { id: 'across', beats: [10, 16] }, { id: 'together', beats: [16, 24] }, { id: 'quiet', beats: [24, 24] }];
  const seconds = commands.at(-1).frame / sr + REST_QUIET_FADE_SECONDS;
  if (seconds < REST_INVITATION_BOUNDS.minSeconds || seconds > REST_INVITATION_BOUNDS.maxSeconds) throw new Error(`invitation lasts ${seconds.toFixed(1)} s; bound is ${REST_INVITATION_BOUNDS.minSeconds}..${REST_INVITATION_BOUNDS.maxSeconds} s.`);
  return { version: 1, tempo, seconds, neighbor: other, third, sections, commands };
}

/** The record the invitation produces if every command is accepted exactly when requested (for tests, the picture and offline rendering). */
export function restInvitationRecord(recipe, invitation) {
  const events = [], contacts = [], active = new Map(); let ended = null;
  invitation.commands.forEach((c, order) => {
    if (c.kind === 'strike') events.push({ frame: c.frame, order, body: c.body, position: c.position, velocity: c.velocity });
    else if (c.kind === 'contact') { const a = active.get(c.body); if (a) { if (c.frame > a.start) contacts.push({ ...a, end: c.frame }); active.delete(c.body); } if (c.zone !== null) active.set(c.body, { body: c.body, zone: c.zone, strength: c.strength, start: c.frame, order }); }
    else { for (const [body, a] of active) if (c.frame > a.start) contacts.push({ ...a, end: c.frame }); active.clear(); ended = { frame: c.frame, fadeFrames: c.fadeFrames }; }
  });
  return validateRestRecord({ version: REST_RECORD_VERSION, kind: REST_RECORD_KIND, grove: recipe.grove, voice: recipe.voice, sampleRate: recipe.sampleRate, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })),
    events, contacts: contacts.sort((a, b) => a.start - b.start || a.order - b.order), ended }, recipe);
}

/** Every picture frame of a record at a fixed rate in one sequential pass (O(samples)), identical to sampling restRecordVisual at i/fps;
 *  the exact terminal frame is appended. For a worker preparing a replay picture, this is far cheaper than per-frame checkpoint replay. */
export function restRecordPictureFrames(record, recipe, { fps = 60 } = {}) {
  if (!Number.isInteger(fps) || fps < 1 || fps > 240) throw new Error('fps must be an integer in 1..240.');
  validateRestRecord(record, recipe);
  const sr = recipe.sampleRate, frames = restRecordLength(record, recipe), engine = createRestEngine(recipe), out = [];
  const byFrame = new Map(); for (const k of record.events) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  const snapshot = (frame, time) => { const v = visualFromState(recipe, engine.state, keyAt(frame)); const fade = record.ended ? Math.max(0, Math.min(1, 1 - (frame - record.ended.frame) / record.ended.fadeFrames)) : 1;
    return { time, envelope: v.envelope.map(x => x * fade), lowBand: true, contacts: v.contacts, strikes: fade ? record.events.filter(e => frame >= e.frame && frame < e.frame + 0.3 * sr).map(e => ({ ...e, strikeU: recipe.positions[e.position], age: (frame - e.frame) / sr })) : [] }; };
  const count = Math.ceil(frames / sr * fps); let next = 0;
  for (let i = 0; i <= frames; i++) {
    while (next < count && Math.min(frames, Math.floor(next / fps * sr)) === i) { out.push(snapshot(i, next / fps)); next++; }
    if (i === frames) break;
    const due = byFrame.get(i); if (due) for (const k of due) engine.strike(k.position, k.body, k.velocity);
    engine.setContacts(keyAt(i)); engine.step();
  }
  out.push(snapshot(frames, frames / sr));
  return { fps, duration: frames / sr, frames: out };
}

/** What a movie plan needs from a Rest record, in the shape the Grove plan reads: exact PCM, sample count and the picture at any time. */
export function restMovieSource(record, recipe, { every = 1024 } = {}) {
  validateRestAdmission(record, recipe);
  const audioSamples = restRecordLength(record, recipe), picture = restRecordVisual(record, recipe, { every });
  return { kind: REST_RECORD_KIND, sampleRate: recipe.sampleRate, audioSamples, duration: audioSamples / recipe.sampleRate, capture: JSON.parse(canonicalRestRecord(record, recipe)),
    sample: time => picture.visual(time), pcm: () => renderRestRecord(record, recipe), voiceLabel: 'Rest · exploration' };
}

/** The recipe a record was made with, rebuilt from the record alone (grove, voice, rate, zones, strengths with coefficients), then validated against it. */
export function recipeForRecord(record) {
  if (!record || record.kind !== REST_RECORD_KIND) throw new Error('not a Rest record.');
  if (!Array.isArray(record.strengths) || !record.strengths.length) throw new Error('record strengths must be a non-empty [{ name, c }] list.');
  const strengths = record.strengths.every(st => typeof st === 'string') ? Object.fromEntries(record.strengths.map(name => { if (!(name in REST_STRENGTHS)) throw new Error(`unknown default strength ${name}.`); return [name, REST_STRENGTHS[name]]; })) : Object.fromEntries(record.strengths.map(st => [st.name, st.c]));
  const recipe = createGroveRestRecipe(record.grove, record.voice, { sampleRate: record.sampleRate, zones: record.zones, strengths });
  validateRestRecord(record, recipe);
  return recipe;
}

/** Admission replayed: every strike must satisfy the energy rule at its actual frame, through the same engine and contact evolution the
 *  audio thread used; a public record that would have been rejected live is rejected here. Returns { bounds } per strike. */
export function validateRestAdmission(record, recipe) {
  validateRestRecord(record, recipe);
  const engine = createRestEngine(recipe), bounds = [];
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  let frame = 0;
  for (const [index, k] of record.events.entries()) {
    for (; frame < k.frame; frame++) { engine.setContacts(keyAt(frame)); engine.step(); }
    engine.setContacts(keyAt(frame));
    const bound = engine.candidateBound(k.position, k.body, k.velocity);
    if (!(bound <= recipe.admissionCeiling)) throw new Error(`events[${index}] (frame ${k.frame}) would have been rejected: bound ${bound.toFixed(4)} exceeds the admission ceiling ${recipe.admissionCeiling}.`);
    bounds.push(bound); engine.strike(k.position, k.body, k.velocity);
  }
  return { bounds };
}

/** What was just heard in the Rest invitation: the authored fact, one sentence; the neighbour's ring is "changed", never "quieter". */
export function restInvitationSettledLine(invitation) {
  const ids = invitation.sections.map(s => s.id).join();
  if (ids !== 'ring,rest,across,together,quiet') throw new Error('not a Rest invitation.');
  return `A free ring. Then a firm hand on the struck body: its ring died under the hand. Then the same strike with the hand on body ${invitation.neighbor + 1} instead: the bridge carried the change and the ring was different, not simply quieter. All three with a light hand, then Quiet.`;
}

// ---- a compact guided exploration after the invitation: strike, rest here, lift, fresh strike, rest on the neighbour ----
// Not an authored passage: the player plays and the page shows one prompt at a time. Progress is decided only by acknowledged,
// accepted gestures in the audio thread's actual order (a later frame, or the same frame with a later order), never by requests,
// and never by any claim to hear silence: the lift step waits for the hand to lift, whenever the player chooses.
export const REST_EXPLORATION_STEPS = Object.freeze(['ring', 'here', 'lift', 'neighbor', 'done']);
export function restExplorationPrompt(step, body, neighbor) {
  const b = `body ${body + 1}`, n = `body ${neighbor + 1}`;
  return { ring: `Strike ${b} once and let it ring.`, here: `Strike ${b} again, and while it rings rest a hand on it.`, lift: 'Lift the hand when you want to hear what remains.',
    neighbor: `Strike ${b} once more, and this time rest the hand on ${n} instead.`, done: 'That is the whole gesture: strike, rest here, lift, rest on the neighbour. Play on, or choose Quiet.' }[step];
}
export function createRestExploration(recipe, { body = 0 } = {}) {
  const g = recipe.grove;
  if (!Number.isInteger(body) || body < 0 || body >= recipe.bodies) throw new Error('body must index the grove.');
  const bridge = g.bridges.find(e => e.a === body || e.b === body);
  if (!bridge) throw new Error('the exploration needs a body with a bridge.');
  const neighbor = bridge.a === body ? bridge.b : bridge.a;
  let step = 0, struck = false, lastStrikeFrame = -1, lastStrikeOrder = -1;
  const current = () => ({ step: REST_EXPLORATION_STEPS[step], prompt: restExplorationPrompt(REST_EXPLORATION_STEPS[step], body, neighbor), body, neighbor, done: step === REST_EXPLORATION_STEPS.length - 1 });
  const after = ack => struck && (ack.appliedFrame > lastStrikeFrame || (ack.appliedFrame === lastStrikeFrame && (ack.order ?? -1) > lastStrikeOrder));
  return {
    get state() { return current(); },
    /** Feed one acknowledgement { accepted, appliedFrame, order, event: { kind, body, zone } }. Returns the state after it. */
    acknowledge(ack) {
      if (!ack?.accepted || !ack.event) return current();
      const e = ack.event, id = REST_EXPLORATION_STEPS[step];
      if (e.kind === 'strike' && e.body === body) {
        if (id === 'ring') { step = 1; struck = false; return current(); }           // the first strike is consumed: the next step asks for another
        struck = true; lastStrikeFrame = ack.appliedFrame; lastStrikeOrder = ack.order ?? -1; return current();
      }
      if (e.kind !== 'contact') return current();
      const restOn = e.zone !== null && e.zone !== undefined;
      if (id === 'here' && restOn && e.body === body && after(ack)) { step = 2; return current(); }
      if (id === 'lift' && !restOn && e.body === body) { step = 3; struck = false; return current(); }
      if (id === 'neighbor' && restOn && e.body === neighbor && after(ack)) { step = 4; return current(); }
      return current();
    },
    reset() { step = 0; struck = false; lastStrikeFrame = -1; lastStrikeOrder = -1; return current(); },
  };
}

// ---- the same gestures, another grove (proposal 018) ----
/** Carry a Rest record's gestures (bodies, positions, zones, strengths, frames) onto another grove's recipe at the same rate. Strikes the
 *  target would have rejected live are dropped and reported, never kept; contacts are copied; the result validates and re-admits.
 *  The target is the caller's explicit choice (never chosen here); `complete` is false whenever anything was dropped, and the page must
 *  not call an incomplete transposition the same passage. */
export function transposeRestRecord(record, source, target) {
  // The source must be a passage that could have been played: structurally valid and admissible; the transposition is only as honest as its source.
  validateRestAdmission(record, source);
  // The gesture vocabulary must be identical, not merely the same size: the same strike coordinates, the same rest coordinates, the same
  // strength names with the same coefficients, the same rate and body count. Otherwise "every gesture carried over" would be false.
  if (target.sampleRate !== source.sampleRate || target.bodies !== source.bodies) throw new Error('target recipe must match the source in sample rate and body count.');
  if (stable(target.positions) !== stable(source.positions) || stable(target.zones) !== stable(source.zones) || stable(target.strengths) !== stable(source.strengths) || stable(target.voice) !== stable(source.voice)) throw new Error('target recipe must use the same strike positions, rest zones, strength names and coefficients and voice config as the source; no remapping is defined.');
  const engine = createRestEngine(target), kept = [], dropped = [];
  const keyAt = i => contactStateKey(Array.from({ length: target.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  let frame = 0;
  for (const k of record.events) {
    for (; frame < k.frame; frame++) { engine.setContacts(keyAt(frame)); engine.step(); }
    engine.setContacts(keyAt(frame));
    const bound = engine.candidateBound(k.position, k.body, k.velocity);
    if (bound <= target.admissionCeiling) { kept.push({ ...k }); engine.strike(k.position, k.body, k.velocity); } else dropped.push({ ...k, bound });
  }
  const out = { ...structuredClone(record), grove: target.grove, voice: target.voice, outputGain: target.outputGain, zones: target.zones.slice(), strengths: target.strengths.map(st => ({ name: st.name, c: st.c })), events: kept };
  validateRestAdmission(out, target);
  const kept_ = kept.length, total = record.events.length;
  const note = !dropped.length ? 'every gesture carried over.' : kept_ === 0 ? `no strike carried over: all ${total} were too loud for this grove at those moments; only the rests remain. This is not the same passage.` : `${dropped.length} of ${total} strikes were too loud for this grove at those moments and were left out; the rests and the other ${kept_} strikes carried over.`;
  return { record: out, dropped, kept: kept_, total, complete: dropped.length === 0, note };
}
