// The ensemble record (proposal: collab/notes/fable-ensemble-contract.md, agreed 2026-11-01): three canonical Rest records on ONE clock plus a
// fixed mix. Pure validation, canonical form and rendering; rebuilt from the file alone. A struck part is a complete Rest record whose frame 0
// is the ensemble origin; a never-struck part is a complete Rest record with no events (its identity and its full contact history kept, zero
// sound). Every part is validated and admitted by the ordinary Rest rules via recipeForRecord, which also rejects unknown fields, non-finite
// values and oversized data. The mix is declared and fixed: Float32 part PCM (renderRestRecord) × 1/3 accumulated in Float64, rounded once to
// Float32, which is exactly what the diagnostic processor computes live. No host, no UI; nothing here claims what the result sounds like.
import { REST_MAX_SECONDS } from '../rest/limits.js';
import { recipeForRecord, validateRestAdmission, canonicalRestRecord, renderRestRecord, REST_RECORD_KIND } from './grove-rest.js';

export const ENSEMBLE_RECORD_KIND = 'imagimusic-grove-ensemble', ENSEMBLE_RECORD_VERSION = 1, ENSEMBLE_PARTS = 3, ENSEMBLE_MIX_GAIN = 1 / 3;
export const ENSEMBLE_MIX_ARITHMETIC = 'Float32(engine sample) × common fade → Float32 part (as renderRestRecord); Float32 parts × mixGain accumulated in Float64 → one Float32 rounding → output and capture';
const stable = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x));
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what} has an unknown field ${k}.`); for (const k of keys) if (!(k in obj)) throw new Error(`${what} is missing ${k}.`); };

/** Validate an ensemble record and return the three recipes (one per part). Throws on anything outside the contract.
 *  `admission: false` skips the per-part admission simulation (structure, identity, bounds and the common ending are still checked); use it only
 *  when the caller will simulate the parts itself and check each strike's candidate bound against recipe.admissionCeiling as it goes, which the
 *  mix-only renderer can do in its single pass, so a full-length record is simulated once rather than twice. */
export function validateEnsembleRecord(record, { admission = true } = {}) {
  if (typeof admission !== 'boolean') throw new Error('admission must be a boolean.');
  keysExactly(record, ['version', 'kind', 'sampleRate', 'mixGain', 'mixArithmetic', 'ended', 'parts'], 'EnsembleRecord');
  if (record.version !== ENSEMBLE_RECORD_VERSION || record.kind !== ENSEMBLE_RECORD_KIND) throw new Error('not an ensemble record (version 1).');
  if (record.mixGain !== ENSEMBLE_MIX_GAIN) throw new Error('ensemble mix gain is fixed at 1/3.');
  if (record.mixArithmetic !== ENSEMBLE_MIX_ARITHMETIC) throw new Error('ensemble mix arithmetic must be the declared one, verbatim.');
  if (!Number.isInteger(record.sampleRate) || record.sampleRate < 8000 || record.sampleRate > 192000) throw new Error('sampleRate must be an integer in 8000..192000.');
  keysExactly(record.ended, ['frame', 'fadeFrames'], 'ended');
  if (!Number.isSafeInteger(record.ended.frame) || record.ended.frame < 0 || !Number.isInteger(record.ended.fadeFrames) || record.ended.fadeFrames < 1 || record.ended.fadeFrames > record.sampleRate) throw new Error('ended must be { frame ≥ 0, fadeFrames in 1..sampleRate }.');
  if (record.ended.frame > REST_MAX_SECONDS * record.sampleRate) throw new Error(`ended.frame beyond ${REST_MAX_SECONDS} s.`);
  if (!Array.isArray(record.parts) || record.parts.length !== ENSEMBLE_PARTS) throw new Error(`parts must be exactly ${ENSEMBLE_PARTS}.`);
  const recipes = [];
  record.parts.forEach((part, i) => {
    keysExactly(part, ['index', 'silent', 'record'], `parts[${i}]`);
    if (part.index !== i) throw new Error(`parts[${i}].index must be ${i}.`); if (typeof part.silent !== 'boolean') throw new Error(`parts[${i}].silent must be a boolean.`);
    if (!part.record || part.record.kind !== REST_RECORD_KIND) throw new Error(`parts[${i}].record must be a Rest record.`);
    const recipe = recipeForRecord(part.record);                     // full Rest validation: identity, bounds, order, unknown fields, limits
    if (admission) validateRestAdmission(part.record, recipe);       // conservative admission on its own instrument (or deferred to the caller's pass)
    if (part.record.sampleRate !== record.sampleRate) throw new Error(`parts[${i}]: sample rate differs from the ensemble.`);
    if (stable(part.record.voice) !== stable(record.parts[0].record.voice)) throw new Error(`parts[${i}]: voice differs from part 0.`);
    if (stable(part.record.ended) !== stable(record.ended)) throw new Error(`parts[${i}]: ending differs from the common ending.`);
    if (part.silent !== (part.record.events.length === 0)) throw new Error(`parts[${i}]: silent must be true exactly when the part has no strikes.`);
    recipes.push(recipe);
  });
  return recipes;
}

/** Build an ensemble record from three Rest records already on the shared origin (frame 0 = ensemble origin), sharing one ending. */
export function ensembleRecordFromParts(records) {
  if (!Array.isArray(records) || records.length !== ENSEMBLE_PARTS) throw new Error(`need exactly ${ENSEMBLE_PARTS} part records.`);
  if (!records[0]?.ended) throw new Error('part records must be ended.');
  const record = { version: ENSEMBLE_RECORD_VERSION, kind: ENSEMBLE_RECORD_KIND, sampleRate: records[0].sampleRate, mixGain: ENSEMBLE_MIX_GAIN, mixArithmetic: ENSEMBLE_MIX_ARITHMETIC,
    ended: { frame: records[0].ended.frame, fadeFrames: records[0].ended.fadeFrames }, parts: records.map((r, index) => ({ index, silent: r.events.length === 0, record: r })) };
  validateEnsembleRecord(record); return record;
}

/** Canonical text: parts in index order, each Rest record in its canonical form, keys sorted. Identity for hashing and comparison. */
export function canonicalEnsembleRecord(record) {
  const recipes = validateEnsembleRecord(record);
  return stable({ version: record.version, kind: record.kind, sampleRate: record.sampleRate, mixGain: record.mixGain, mixArithmetic: record.mixArithmetic, ended: record.ended,
    parts: record.parts.map((p, i) => ({ index: p.index, silent: p.silent, record: JSON.parse(canonicalRestRecord(p.record, recipes[i])) })) });
}

export function ensembleRecordLength(record) { validateEnsembleRecord(record); return record.ended.frame + record.ended.fadeFrames; }

/** Render from the file alone: each part by renderRestRecord (Float32), then the declared mix. A silent part contributes exact zeros. */
export function renderEnsembleRecord(record) {
  const recipes = validateEnsembleRecord(record), frames = ensembleRecordLength(record);
  const parts = record.parts.map((p, i) => renderRestRecord(p.record, recipes[i]));
  const channels = parts[0].channels.length, mix = Array.from({ length: channels }, () => new Float32Array(frames));
  parts.forEach((pcm, i) => { if (pcm.channels.length !== channels || pcm.channels[0].length !== frames) throw new Error(`part ${i} rendered a different length or channel count.`); });
  for (let ch = 0; ch < channels; ch++) for (let k = 0; k < frames; k++) { let sum = 0; for (const pcm of parts) sum += pcm.channels[ch][k] * ENSEMBLE_MIX_GAIN; mix[ch][k] = Math.fround(sum); }
  return { sampleRate: record.sampleRate, channels: mix, parts };
}
