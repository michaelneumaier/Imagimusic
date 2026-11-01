// Powered recipe and record (Astra's powered-encounter note, 2026-11-01).
//
// Timing contract (pinned with Astra, 091941Z):
// - The driver runs over [startFrame, startFrame + forcedFrames); a capture stores the ACTUAL forcedFrames = min(planned, quietFrame − startFrame),
//   so an early Quiet truncates the force at Quiet's applied frame; nothing is injected at or after Quiet; contacts end at Quiet.
// - forcedFrames may be 0 (Quiet at the origin): a valid, silent driver; no sample is fabricated.
// - The natural ending of the first encounter is ended.frame = startFrame + forcedFrames + ringFrames (the 2 s + 3 s), and the Quiet fade is
//   APPENDED after it: the rendered length is ended.frame + fadeFrames, exactly as the Rest route (restRecordLength); read as Float32, then fade. A powered recipe is a Rest recipe plus one declared external force
// direction (a unit strike vector) and, per contact state, the exact affine input vector Γ beside Φ. A powered record is its own kind,
// never a Rest record: it carries the declared driver (frequency, amplitude, start frame, forced frames) beside strikes, contacts and Quiet.
import { voiceSystem } from './grove-voice.js';
import { forcedStepper } from '../coupling.js';
import { createGroveRestRecipe, recipeForRecord, validateRestRecord, REST_RECORD_KIND, REST_RECORD_VERSION } from './grove-rest.js';
import { REST_MAX_SECONDS, REST_QUIET_FADE_SECONDS } from '../rest/limits.js';
import { POWERED_RECIPE_VERSION, createPoweredEngine, renderPoweredPassage, poweredForceAt, forceRotation, createForceSequence, contactStateKey } from '../rest/powered-engine.js';
import { visualFromState } from '../rest/engine.js';
export const POWERED_RECORD_KIND = 'imagimusic-grove-powered', POWERED_RECORD_VERSION = 2, POWERED_FORCE_LAW = 'rotation-recurrence-v1', POWERED_CEILING_SHARE = 0.5;
// Version 2 declares the source as the rotation recurrence from stored constants (version 1, a sample-held Math.sin source, never shipped: it was not
// bit-identical across JavaScript engines). Limitations, stated: the recurrence's amplitude drifts by O(n·ε) over n samples (about 1e-11 relative over
// two minutes); that drift is part of the declared input, not an error; the budget below sums the actual declared samples, so it is exact for the
// declared input. The scalar recurrence uses specified IEEE arithmetic; equality of a whole render across runtimes is a matter of measurement, not
// of this declaration (the model operators are computed per runtime).
// Measured limit (Astra, 2026-11-01, renders/powered-v2-audio-check): a Safari worklet capture rebuilt in Node differed in 2 of 241200 left-channel
// samples by at most 1.46e-11 (float32) on seed 3 at 48 kHz, right channel exact; seed 7 at 44.1 kHz exact in both channels. Within one runtime
// the worklet, the capture replay and the exported WAV are exact. Policy: the raw source PCM hash is the exact provenance; a cross-runtime
// reconstruction is described separately with its measured differences when actual samples exist; a failed hash is never silently passed.

/** Add the declared force direction and per-state Γ to a Rest recipe (one augmented exponential per contact state, off the audio thread). */
export function createPoweredRecipe(recipe, { body = 0, position = 1 } = {}) {
  if (!Number.isInteger(body) || body < 0 || body >= recipe.bodies || !Number.isInteger(position) || position < 0 || position >= recipe.positions.length) throw new Error('body and position must index the recipe.');
  const { system } = voiceSystem(recipe.grove, recipe.voice), direction = Float64Array.from(recipe.strikeVectors[position][body]);
  const contactStates = recipe.contactStates.map(s => {
    const contacts = s.contacts.map(c => ({ body: c.body, u: c.u, c: c.c }));
    const st = forcedStepper(system, { contacts, sampleRate: recipe.sampleRate, direction });
    return { key: s.key, contacts: s.contacts, phi: Array.from(st.phi), gamma: Array.from(st.gamma) };
  });
  const directionNorm = Math.sqrt(direction.reduce((a, v) => a + v * v, 0)), fmax = Math.max(...recipe.energyFactors);
  return { ...recipe, poweredVersion: POWERED_RECIPE_VERSION, contactStates, driver: { body, position, u: recipe.positions[position], directionNorm, energyFactorMax: fmax },
    poweredAdmission: `by linearity the output is the passive part plus the forced part, so |out| ≤ outputGain·fmax·√(2E_passive) + outputGain·fmax·‖b‖∫|f|; strikes are admitted against ${POWERED_CEILING_SHARE} of the ceiling with candidateBound and the declared driver's budget outputGain·fmax·‖b‖·Σ|f_n|/sr must not exceed the other ${1 - POWERED_CEILING_SHARE}; both halves together never exceed the admission ceiling; a contact switch only changes damping and cannot raise either part` };
}

/** The largest amplitude the declared driver may have: its full budget at (1 − share) of the ceiling, from the exact held-force integral. */
export function poweredAmplitudeLimit(recipe, { frequencyHz, forcedFrames, rotation }) {
  // The budget sums the ACTUAL declared samples: the recurrence at unit amplitude from the stored (or, at composition, freshly computed) rotation constants.
  const sr = recipe.sampleRate, seq = createForceSequence({ rotation: rotation ?? forceRotation(frequencyHz, sr), startFrame: 0, forcedFrames, amplitude: 1 });
  let integral = 0; for (let n = 0; n < forcedFrames; n++) integral += Math.abs(seq.next()) / sr;
  // A drive whose declared samples are all zero (for example forcedFrames = 1, where f₀ = sin 0 = 0) injects nothing, so any amplitude is within budget.
  if (!(integral > 0)) return Infinity;
  return (1 - POWERED_CEILING_SHARE) * recipe.admissionCeiling / (recipe.outputGain * recipe.driver.energyFactorMax * recipe.driver.directionNorm * integral);
}

const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
/** Validate a powered record against its powered recipe. Strikes and contacts follow the Rest rules; the driver is bounded and matches the recipe's direction. */
export function validatePoweredRecord(record, recipe) {
  if (record?.kind !== POWERED_RECORD_KIND || record.version !== POWERED_RECORD_VERSION) throw new Error(`not a powered record (version ${POWERED_RECORD_VERSION}).`);
  const { driver, ...rest } = record, restRecord = { ...rest, kind: REST_RECORD_KIND, version: REST_RECORD_VERSION };
  validateRestRecord(restRecord, recipe);   // schema, canonical grove/voice/zones/strengths, chronology, contacts, Quiet closure, bounds
  if (!driver || typeof driver !== 'object') throw new Error('driver is required.');
  const keys = Object.keys(driver).sort().join(); if (keys !== 'amplitude,body,forcedFrames,frequencyHz,law,position,rotation,startFrame') throw new Error('driver must have exactly amplitude, body, forcedFrames, frequencyHz, law, position, rotation, startFrame.');
  if (driver.law !== POWERED_FORCE_LAW) throw new Error(`driver.law must be ${POWERED_FORCE_LAW}.`);
  // The declared input is the recurrence from the stored rotation constants (bit-exact in every runtime); they must agree with the frequency to 1e-12.
  const rot = forceRotation(driver.frequencyHz, recipe.sampleRate);
  if (!driver.rotation || typeof driver.rotation !== 'object' || Object.keys(driver.rotation).sort().join() !== 'cos,sin' || !Number.isFinite(driver.rotation.cos) || !Number.isFinite(driver.rotation.sin) || Math.abs(driver.rotation.cos - rot.cos) > 1e-12 || Math.abs(driver.rotation.sin - rot.sin) > 1e-12) throw new Error('driver.rotation must be { cos, sin } of 2π·frequencyHz/sampleRate (stored, so every runtime renders the same declared force).');
  if (driver.body !== recipe.driver.body || driver.position !== recipe.driver.position) throw new Error('driver body and position must match the powered recipe.');
  const sr = recipe.sampleRate, limit = REST_MAX_SECONDS * sr;
  if (!Number.isFinite(driver.frequencyHz) || driver.frequencyHz <= 0 || driver.frequencyHz >= sr / 2) throw new Error('driver frequency must be positive and below Nyquist.');
  if (!Number.isSafeInteger(driver.startFrame) || driver.startFrame < 0 || !Number.isSafeInteger(driver.forcedFrames) || driver.forcedFrames < 0 || driver.startFrame + driver.forcedFrames > limit) throw new Error('driver interval must be integer frames (forcedFrames may be 0) within the passage limit.');
  if (record.ended && driver.startFrame + driver.forcedFrames > record.ended.frame) throw new Error('the driver must stop at or before Quiet.');
  if (!Number.isFinite(driver.amplitude) || driver.amplitude < 0) throw new Error('driver amplitude must be a non-negative number.');
  if (driver.amplitude > 0 && driver.forcedFrames > 0) { const maxAmplitude = poweredAmplitudeLimit(recipe, driver); if (driver.amplitude > maxAmplitude * (1 + 1e-12)) throw new Error(`driver amplitude ${driver.amplitude} exceeds the declared budget ${maxAmplitude}.`); }   // a silent driver needs no budget
  return record;
}
export const canonicalPoweredRecord = (record, recipe) => stable(validatePoweredRecord(record, recipe));

/** Admission replayed with the driver running: every strike must satisfy candidateBound ≤ share·ceiling at its frame (passive part), through the same engine. */
export function validatePoweredAdmission(record, recipe) {
  validatePoweredRecord(record, recipe);
  // The passive part alone decides strike admission (linearity); so replay strikes and contacts with zero force.
  const engine = createPoweredEngine(recipe), share = POWERED_CEILING_SHARE * recipe.admissionCeiling, bounds = [];
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  let frame = 0;
  for (const [index, k] of record.events.entries()) {
    for (; frame < k.frame; frame++) { engine.setContacts(keyAt(frame)); engine.step(0); }
    engine.setContacts(keyAt(frame));
    const bound = engine.candidateBound(k.position, k.body, k.velocity);
    if (!(bound <= share)) throw new Error(`events[${index}] (frame ${k.frame}) would have been rejected: passive bound ${bound.toFixed(4)} exceeds ${share} (the strikes' share of the ceiling in a powered passage).`);
    bounds.push(bound); engine.strike(k.position, k.body, k.velocity);
  }
  return { bounds };
}

export function poweredRecordLength(record, recipe) {
  if (record.ended) return record.ended.frame + record.ended.fadeFrames;
  const unit = Math.ceil(recipe.ring * recipe.sampleRate), driverEnd = record.driver.startFrame + record.driver.forcedFrames + unit;
  return Math.max(driverEnd, ...record.events.map(e => e.frame + unit), ...record.contacts.map(c => c.end));
}

/** Exact render: the engine with the declared force and the recorded Quiet fade (Float32 first, then the fade, as the Rest route does). */
export function renderPoweredRecord(record, recipe) {
  validatePoweredAdmission(record, recipe);
  const frames = poweredRecordLength(record, recipe), out = renderPoweredPassage(recipe, { strikes: record.events, contacts: record.contacts, driver: record.driver, frames });
  if (record.ended) for (const ch of out) for (let i = 0; i < frames; i++) ch[i] *= Math.max(0, Math.min(1, 1 - (i - record.ended.frame) / record.ended.fadeFrames));
  return { sampleRate: recipe.sampleRate, channels: out };
}

/** The powered recipe a record was made with, from the record alone. */
export function poweredRecipeForRecord(record) {
  const { driver, ...rest } = record, base = recipeForRecord({ ...rest, kind: REST_RECORD_KIND, version: REST_RECORD_VERSION });
  return createPoweredRecipe(base, { body: driver.body, position: driver.position });
}

/** The bounded first encounter as a record: the declared driver (2 s on, 3 s release), the player's c = 1 contacts at u = 0.3 or u = 1 on the driven body, then Quiet. */
export function composeEncounterRecord(recipe, { contacts = [], frequencyHz = recipe.grove.bodies[recipe.driver.body].hz, forceSeconds = 2, ringSeconds = 3, startFrame = 0 } = {}) {
  const sr = recipe.sampleRate, forcedFrames = Math.round(forceSeconds * sr), rotation = forceRotation(frequencyHz, sr), amplitude = poweredAmplitudeLimit(recipe, { frequencyHz, forcedFrames, rotation });
  if (!Number.isFinite(amplitude)) throw new Error('the planned drive integrates to zero; choose a longer forceSeconds.');
  const ended = { frame: startFrame + forcedFrames + Math.round(ringSeconds * sr), fadeFrames: Math.round(REST_QUIET_FADE_SECONDS * sr) };
  const record = { version: POWERED_RECORD_VERSION, kind: POWERED_RECORD_KIND, grove: recipe.grove, voice: recipe.voice, sampleRate: sr, outputGain: recipe.outputGain, zones: recipe.zones, strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })),
    driver: { body: recipe.driver.body, position: recipe.driver.position, frequencyHz, amplitude, startFrame, forcedFrames, rotation, law: POWERED_FORCE_LAW }, events: [], contacts: contacts.map((c, i) => ({ ...c, order: i })), ended };
  return validatePoweredRecord(record, recipe);
}
export { createGroveRestRecipe, poweredForceAt, forceRotation, createForceSequence };

/** Every picture frame of a powered record at a fixed rate in one sequential pass through the powered engine (the force shapes the state), with
 *  the exact terminal frame appended; the same fields as the Rest picture plus `driverActive` for the frame's interval. */
export function poweredRecordPictureFrames(record, recipe, { fps = 60 } = {}) {
  if (!Number.isInteger(fps) || fps < 1 || fps > 240) throw new Error('fps must be an integer in 1..240.');
  validatePoweredAdmission(record, recipe);
  const sr = recipe.sampleRate, frames = poweredRecordLength(record, recipe), engine = createPoweredEngine(recipe), out = [], d = record.driver, force = createForceSequence(d);
  const byFrame = new Map(); for (const k of record.events) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = record.contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  const snapshot = (frame, time) => { const v = visualFromState(recipe, engine.state, keyAt(frame)); const fade = record.ended ? Math.max(0, Math.min(1, 1 - (frame - record.ended.frame) / record.ended.fadeFrames)) : 1;
    return { time, envelope: v.envelope.map(x => x * fade), lowBand: true, contacts: v.contacts, driverActive: frame >= d.startFrame && frame < d.startFrame + d.forcedFrames, strikes: fade ? record.events.filter(e => frame >= e.frame && frame < e.frame + 0.3 * sr).map(e => ({ ...e, strikeU: recipe.positions[e.position], age: (frame - e.frame) / sr })) : [] }; };
  const count = Math.ceil(frames / sr * fps); let next = 0;
  for (let i = 0; i <= frames; i++) {
    while (next < count && Math.min(frames, Math.floor(next / fps * sr)) === i) { out.push(snapshot(i, next / fps)); next++; }
    if (i === frames) break;
    const due = byFrame.get(i); if (due) for (const k of due) engine.strike(k.position, k.body, k.velocity);
    engine.setContacts(keyAt(i)); engine.step(force.next());
  }
  out.push(snapshot(frames, frames / sr));
  return { fps, duration: frames / sr, frames: out };
}

// ---- after the encounter (proposal 021): what was just done, and the same touch on another grove ----
/** One sentence of fact from a powered record: when the hands rested, where, and when the source stopped; no claim about the listener. At most
 *  `maxContacts` intervals are spelled out (a record may hold 256); the rest are counted. The page shows the next invitation, not this line. */
export function poweredSettledLine(record, recipe, { maxContacts = 4 } = {}) {
  validatePoweredRecord(record, recipe);
  const sr = recipe.sampleRate, d = record.driver, zoneName = z => (recipe.zones[z] === 1 ? 'the bridge tip' : recipe.zones[z] === 0.3 ? 'the upper zone' : `u = ${recipe.zones[z]}`), t = f => (f / sr).toFixed(1) + ' s';
  // A capture stores the actual forced frames; when Quiet fell at the source's end there was no release interval, so the source was stopped by Quiet.
  const source = d.forcedFrames === 0 ? 'The source never ran.' : `The source ran for ${t(d.forcedFrames)}${record.ended && record.ended.frame === d.startFrame + d.forcedFrames ? ' (stopped by Quiet)' : ''}.`;
  const spelled = record.contacts.slice(0, maxContacts).map(c => `a hand at ${zoneName(c.zone)} from ${t(c.start)} to ${t(c.end)}`), more = record.contacts.length - spelled.length;
  const hands = record.contacts.length ? spelled.join(', ') + (more > 0 ? ` and ${more} more` : '') : 'no hand rested on the body';
  return `${source} ${hands.charAt(0).toUpperCase() + hands.slice(1)}; the rest was the instrument answering.`;
}

/** The same touch on another grove (proposal 021; a model experiment, no UI): identical contact timing and positions on another curated grove,
 *  with the target grove's OWN ordinary encounter source: its tuning, and the amplitude of its standard planned drive (plannedForcedFrames, the
 *  encounter's 2 s by default), truncated at the same early Quiet exactly as the source record was, so a short record is never louder than the
 *  target's ordinary encounter. Records with strikes are refused rather than silently stripped: the first encounter has none. A force in newtons
 *  is never transplanted between instruments of different mass and gain. Reviewed with Astra so far: the planned-level correction only; general
 *  transposition semantics remain a proposal until a real listening need justifies a surface. */
export function transposePoweredRecord(record, sourceRecipe, targetRecipe, { plannedForcedFrames = 2 * sourceRecipe.sampleRate } = {}) {
  validatePoweredAdmission(record, sourceRecipe);
  if (record.events.length) throw new Error('records with strikes are not transposed (the first encounter has none); nothing is dropped silently.');
  if (targetRecipe.sampleRate !== sourceRecipe.sampleRate || targetRecipe.bodies !== sourceRecipe.bodies) throw new Error('target recipe must match the source in sample rate and body count.');
  const stable = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
  if (stable(targetRecipe.positions) !== stable(sourceRecipe.positions) || stable(targetRecipe.zones) !== stable(sourceRecipe.zones) || stable(targetRecipe.strengths) !== stable(sourceRecipe.strengths) || stable(targetRecipe.voice) !== stable(sourceRecipe.voice) || targetRecipe.driver.body !== sourceRecipe.driver.body || targetRecipe.driver.position !== sourceRecipe.driver.position) throw new Error('target recipe must use the same positions, zones, strengths, voice and driver direction as the source; no remapping is defined.');
  const d = record.driver;
  if (!Number.isSafeInteger(plannedForcedFrames) || plannedForcedFrames < d.forcedFrames) throw new Error('plannedForcedFrames must be an integer at least the record\'s actual forced frames.');
  const frequencyHz = targetRecipe.grove.bodies[d.body].hz, rotation = forceRotation(frequencyHz, targetRecipe.sampleRate);
  // The target's ordinary source level: its budget over the PLANNED drive; the actual (possibly truncated) forcedFrames of the record are kept.
  const amplitude = poweredAmplitudeLimit(targetRecipe, { frequencyHz, forcedFrames: plannedForcedFrames, rotation });
  if (!Number.isFinite(amplitude)) throw new Error('the planned drive integrates to zero on the target.');
  const out = { ...structuredClone(record), grove: targetRecipe.grove, voice: targetRecipe.voice, outputGain: targetRecipe.outputGain, zones: targetRecipe.zones.slice(), strengths: targetRecipe.strengths.map(st => ({ name: st.name, c: st.c })),
    driver: { ...d, frequencyHz, rotation, amplitude } };
  validatePoweredAdmission(out, targetRecipe);
  return { record: out, plannedForcedFrames, note: `the same hands at the same moments on Grove ${targetRecipe.grove.seed}; its source is that grove's ordinary encounter source (${frequencyHz.toFixed(1)} Hz at its own declared level for a ${(plannedForcedFrames / targetRecipe.sampleRate).toFixed(1)} s drive), truncated at the same Quiet as the original; levels differ by grove` };
}

/** The immediate next-gesture invitation, from the acknowledged record only: one line that names the one meaningful change not yet tried. */
export function poweredNextInvitation(record, recipe) {
  validatePoweredRecord(record, recipe);
  const zonesUsed = new Set(record.contacts.map(c => recipe.zones[c.zone])), upper = zonesUsed.has(0.3), tip = zonesUsed.has(1);
  if (record.driver.forcedFrames === 0) return 'Begin again, and let the source run before you decide anything.';
  if (!upper && !tip) return 'Next time, rest a hand on the first body while the source runs, and lift when you want to hear what remains.';
  if (upper && !tip) return 'Next time, rest the hand at the bridge tip instead and listen for what changes.';
  if (tip && !upper) return 'Next time, rest the hand at the upper zone instead and listen for what changes.';
  return 'You have tried both places. Next time, move the hand from one to the other while the source runs, or lift earlier.';
}
