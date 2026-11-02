// A derived ensemble record (proposal: collab/notes/fable-ensemble-rotation.md; Astra's interaction note collab/notes/astra-ensemble-derived-return.md).
// Pure. The version-1 ensemble schema stays strict and unchanged; a derived result is a wrapper around an unchanged strict inner record with a
// declaration of its source and operation. The only operation for now is 'rotate-voices' with rotation 1: each voice's gesture history (events
// and contacts, frames unchanged) moves to the next instrument in the record's fixed order (part 0 → 1 → 2 → 0); the instruments and the common
// ending stay where they are; silent flags are recomputed; every moved history is re-validated and re-admitted on its destination recipe through
// the ordinary path, and a refusal is a refusal of the derived result. The source record is never modified. The source hash is a declared identity
// (SHA-256 of the UTF-8 canonical text with no trailing newline, 64 lowercase hex), computed with the platform's Web Crypto, so the derivation
// and verification functions are async; a reader without the source can show it as a fingerprint but cannot verify it; verifyDerivedEnsemble
// does, given the source. Validation and canonical text of a wrapper stay synchronous.
import { validateEnsembleRecord, ensembleRecordFromParts, canonicalEnsembleRecord, ENSEMBLE_RECORD_KIND, ENSEMBLE_RECORD_VERSION } from './grove-ensemble-record.js';

export const ENSEMBLE_DERIVED_KIND = 'imagimusic-grove-ensemble-derived', ENSEMBLE_DERIVED_VERSION = 1;
export const DERIVED_OPERATIONS = Object.freeze({ 'rotate-voices': Object.freeze({ rotations: Object.freeze([1]) }) });
const stable = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(key => [key, x[key]])) : x));
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what} has an unknown field ${k}.`); for (const k of keys) if (!(k in obj)) throw new Error(`${what} is missing ${k}.`); };

/** SHA-256 of a UTF-8 string through the platform's Web Crypto (Node and browsers), lowercase hex. Async by nature; the derivation API is
 *  therefore async (preparation already runs off the main thread), rather than carrying a second SHA-256 implementation for a synchronous call. */
export async function sha256Hex(text) {
  const subtle = globalThis.crypto?.subtle; if (!subtle) throw new Error('Web Crypto (crypto.subtle) is not available here.');
  const digest = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/** The declared identity of a source ensemble record: SHA-256 of its canonical text (UTF-8, no trailing newline). */
export async function canonicalEnsembleSha256(record) { return sha256Hex(canonicalEnsembleRecord(record)); }

/** Validate a derived wrapper (strict) and its inner record; returns the inner recipes. Verifies nothing about the absent source. */
export function validateDerivedEnsemble(wrapper, { admission = true } = {}) {
  keysExactly(wrapper, ['kind', 'version', 'derivedFrom', 'ensemble'], 'DerivedEnsemble');
  if (wrapper.kind !== ENSEMBLE_DERIVED_KIND || wrapper.version !== ENSEMBLE_DERIVED_VERSION) throw new Error('not a derived ensemble (version 1).');
  keysExactly(wrapper.derivedFrom, ['kind', 'version', 'canonicalSha256', 'operation', 'rotation'], 'derivedFrom');
  const d = wrapper.derivedFrom;
  if (d.kind !== ENSEMBLE_RECORD_KIND || d.version !== ENSEMBLE_RECORD_VERSION) throw new Error('derivedFrom must name a version-1 ensemble record.');
  if (typeof d.canonicalSha256 !== 'string' || !/^[0-9a-f]{64}$/.test(d.canonicalSha256)) throw new Error('derivedFrom.canonicalSha256 must be 64 lowercase hex characters.');
  const op = typeof d.operation === 'string' && Object.hasOwn(DERIVED_OPERATIONS, d.operation) ? DERIVED_OPERATIONS[d.operation] : null; if (!op) throw new Error(`unsupported derivation operation ${String(d.operation)}.`);
  if (!op.rotations.includes(d.rotation)) throw new Error(`rotation ${d.rotation} is not supported for ${d.operation} (supported: ${op.rotations.join(', ')}).`);
  return validateEnsembleRecord(wrapper.ensemble, { admission });
}

/** Rotate each voice's gesture history to the next instrument (rotation 1 only). Resolves to a validated wrapper; the source is untouched. */
export async function rotateEnsembleVoices(input, { rotation = 1 } = {}) {
  if (rotation !== 1) throw new Error('only rotation 1 is supported for rotate-voices in this version.');
  // Snapshot before the first await (Astra's finding): the hash and the histories must describe one and the same source even if the caller
  // mutates its object while the digest is pending.
  const source = structuredClone(input);
  validateEnsembleRecord(source, { admission: false });
  const canonicalSha256 = await canonicalEnsembleSha256(source), parts = source.parts, n = parts.length;
  // Vocabulary must match between a history's source part and its destination part: body count, voice, zones, strengths (name and coefficient),
  // sample rate and gain; indices are then meaningful on the destination, and nothing is remapped.
  const vocab = r => stable({ bodies: r.grove.bodies.length, voice: r.voice, zones: r.zones, strengths: r.strengths, sampleRate: r.sampleRate, outputGain: r.outputGain });
  const moved = parts.map((dest, j) => {
    const src = parts[(j - rotation + n) % n].record;
    if (vocab(src) !== vocab(dest.record)) throw new Error(`part ${j}: the destination instrument's vocabulary (bodies, voice, zones, strengths, rate, gain) differs from the source history's; refusing to remap.`);
    return { ...JSON.parse(JSON.stringify(dest.record)), events: JSON.parse(JSON.stringify(src.events)), contacts: JSON.parse(JSON.stringify(src.contacts)), ended: { ...src.ended } };
  });
  const ensemble = ensembleRecordFromParts(moved);                      // validates, re-admits each moved history on its destination, recomputes silent flags
  return { kind: ENSEMBLE_DERIVED_KIND, version: ENSEMBLE_DERIVED_VERSION, derivedFrom: { kind: ENSEMBLE_RECORD_KIND, version: ENSEMBLE_RECORD_VERSION, canonicalSha256, operation: 'rotate-voices', rotation }, ensemble };
}

/** Canonical text of a derived wrapper: sorted keys, the inner record in its canonical form. */
export function canonicalDerivedEnsemble(wrapper) { validateDerivedEnsemble(wrapper); return stable({ kind: wrapper.kind, version: wrapper.version, derivedFrom: wrapper.derivedFrom, ensemble: JSON.parse(canonicalEnsembleRecord(wrapper.ensemble)) }); }

/** With the source in hand: recompute the derivation and compare identities. Resolves to { verified: true } or rejects with the first mismatch. */
export async function verifyDerivedEnsemble(wrapperInput, sourceInput) {
  const wrapper = structuredClone(wrapperInput), source = structuredClone(sourceInput);   // one coherent pair across the awaits
  validateDerivedEnsemble(wrapper);
  const hash = await canonicalEnsembleSha256(source); if (hash !== wrapper.derivedFrom.canonicalSha256) throw new Error('the given source is not the declared source (canonical hash differs).');
  const recomputed = await rotateEnsembleVoices(source, { rotation: wrapper.derivedFrom.rotation });
  if (canonicalEnsembleRecord(recomputed.ensemble) !== canonicalEnsembleRecord(wrapper.ensemble)) throw new Error('the derived record is not the declared operation applied to the source.');
  return { verified: true, canonicalSha256: hash };
}
