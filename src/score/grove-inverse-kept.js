// A kept inverse candidate: the question (declared target), the answer (canonical Grove), the tolerance it was judged by, the model identity
// it was found under, a declared discovery line, and when it was kept. Residuals and status are never stored; reopening recomputes them from
// grove and target with the solver's own residual, so an edited claim of fit has nowhere to live. No strikes, audio, histories or ledgers: a kept
// candidate is an instrument description, not a performance (those are the ensemble and seeded record kinds).
import { validateGrove, canonicalGrove } from './grove.js';
import { validateInverseTarget, residualAgainstTarget, familyRatioBound, INVERSE_VERSION, INVERSE_LIMITS } from './grove-inverse.js';
import { INVERSE_IMPULSE_NS, INVERSE_DISPLACEMENT_GAIN, INVERSE_PICKUP_BODIES, INVERSE_FADE_SECONDS } from '../inverse/instrument.js';
import { sha256Hex } from './grove-ensemble-derived.js';

export const KEPT_CANDIDATE_KIND = 'imagimusic-inverse-candidate';
export const KEPT_CANDIDATE_VERSION = 1;
export const KEPT_TITLE_MAX = 80;
// Model identity = compatibility metadata: the constants the rendering depends on plus an explicit instrument revision. Equality of these
// values does not detect a future algorithm change by itself; KEPT_INSTRUMENT_REVISION must be bumped for any incompatible rendering change.
export const KEPT_INSTRUMENT_REVISION = 1;
export const KEPT_MODEL = Object.freeze({ inverse: INVERSE_VERSION, instrument: 'imagimusic-three-mass-instrument', instrumentRevision: KEPT_INSTRUMENT_REVISION, impulseNs: INVERSE_IMPULSE_NS, outputGain: INVERSE_DISPLACEMENT_GAIN, fadeSeconds: INVERSE_FADE_SECONDS, pickupBodies: Object.freeze([...INVERSE_PICKUP_BODIES]) });
const KEEPABLE_STATUSES = Object.freeze(['accepted', 'best-outside-tolerance', 'impossible-in-family']);

const fail = m => { throw new Error(`Kept candidate: ${m}`); };
const isoTime = v => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString() === v;   // the exact ISO-8601 UTC form, round-tripped
const keysExactly = (o, keys, what) => { if (!o || typeof o !== 'object' || Array.isArray(o)) fail(`${what} must be an object.`); const k = Object.keys(o).sort(), e = [...keys].sort(); if (k.join() !== e.join()) fail(`${what} must have exactly the fields ${e.join(', ')} (got ${k.join(', ') || 'none'}).`); };
const finite = (v, what) => { if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${what} must be a finite number.`); };
const positive = (v, what) => { finite(v, what); if (v <= 0) fail(`${what} must be positive.`); };
const within = (v, [lo, hi], what) => { finite(v, what); if (v < lo || v > hi) fail(`${what} must be within ${lo}..${hi}.`); };
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
const deepFreeze = v => { if (v && typeof v === 'object') { for (const k of Object.keys(v)) deepFreeze(v[k]); Object.freeze(v); } return v; };

/** Keep candidate `index` of a search report. Refuses a candidate without a grove. Returns a frozen record; stores no residual or status. */
export function keepInverseCandidate(report, index, { at, title } = {}) {
  if (!report || typeof report !== 'object' || !Array.isArray(report.candidates)) fail('a search report with candidates is required.');
  if (!Number.isInteger(index) || index < 0 || index >= report.candidates.length) fail('candidate index out of range.');
  const c = report.candidates[index];
  if (!KEEPABLE_STATUSES.includes(c.status) || !c.grove) fail(`candidate ${index} has no grove to keep (${c.status}).`);
  if (!isoTime(at)) fail('kept.at must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  const kept = { at };
  if (title !== undefined) { if (typeof title !== 'string' || !title.length || title.length > KEPT_TITLE_MAX) fail(`kept.title must be 1..${KEPT_TITLE_MAX} characters.`); kept.title = title; }
  const record = {
    kind: KEPT_CANDIDATE_KIND, version: KEPT_CANDIDATE_VERSION,
    target: JSON.parse(JSON.stringify(validateInverseTarget(report.target))),
    grove: JSON.parse(canonicalGrove(c.grove)),
    tolerance: { cents: report.tolerance.cents, decayRelative: report.tolerance.decayRelative },
    model: JSON.parse(JSON.stringify(KEPT_MODEL)),
    discovery: { seed: report.seed, baseMidi: c.baseMidi, budget: { restarts: report.budget.restarts, iterations: report.budget.iterations, maxEvaluations: report.budget.maxEvaluations }, evaluations: c.evaluations, statusAtDiscovery: c.status },
    kept,
  };
  validateInverseCandidate(record);                                      // validate what was built, before the copy can hide a NaN or an undefined
  return deepFreeze(validateInverseCandidate(JSON.parse(JSON.stringify(record))));
}

/** Shape, own fields, target and grove validity, consistency with the discovery line, tolerance within limits, model identity equal to the current constants. */
export function validateInverseCandidate(r) {
  keysExactly(r, ['kind', 'version', 'target', 'grove', 'tolerance', 'model', 'discovery', 'kept'], 'record');
  if (r.kind !== KEPT_CANDIDATE_KIND) fail(`kind must be ${KEPT_CANDIDATE_KIND}.`);
  if (r.version !== KEPT_CANDIDATE_VERSION) fail(`version must be ${KEPT_CANDIDATE_VERSION}.`);
  validateInverseTarget(r.target);
  validateGrove(r.grove);
  keysExactly(r.tolerance, ['cents', 'decayRelative'], 'tolerance'); positive(r.tolerance.cents, 'tolerance.cents'); positive(r.tolerance.decayRelative, 'tolerance.decayRelative');   // finite and positive; the solver states no other limit
  keysExactly(r.model, Object.keys(KEPT_MODEL), 'model');
  for (const k of ['inverse', 'instrument', 'instrumentRevision', 'impulseNs', 'outputGain', 'fadeSeconds']) if (r.model[k] !== KEPT_MODEL[k]) fail(`model identity differs from the current model (${k}); this record is refused rather than reinterpreted.`);
  // Indexed from the expected array so a sparse array (holes) cannot pass: `every` on the given array would skip holes.
  if (!Array.isArray(r.model.pickupBodies) || r.model.pickupBodies.length !== KEPT_MODEL.pickupBodies.length || !KEPT_MODEL.pickupBodies.every((expected, i) => Object.hasOwn(r.model.pickupBodies, i) && r.model.pickupBodies[i] === expected)) fail('model identity differs from the current model (pickupBodies); this record is refused rather than reinterpreted.');
  keysExactly(r.discovery, ['seed', 'baseMidi', 'budget', 'evaluations', 'statusAtDiscovery'], 'discovery');
  if (!Number.isInteger(r.discovery.seed) || r.discovery.seed < 0 || r.discovery.seed > 4294967295) fail('discovery.seed must be an integer within 0..4294967295.');
  if (r.discovery.baseMidi !== r.grove.cluster.baseMidi) fail('discovery.baseMidi must equal the grove\'s cluster base.');
  keysExactly(r.discovery.budget, ['restarts', 'iterations', 'maxEvaluations'], 'discovery.budget');
  for (const [k, limit] of [['restarts', INVERSE_LIMITS.restarts], ['iterations', INVERSE_LIMITS.iterations], ['maxEvaluations', INVERSE_LIMITS.maxEvaluations]]) { const v = r.discovery.budget[k]; if (!Number.isInteger(v) || v < 1 || v > limit) fail(`budget.${k} must be an integer within 1..${limit}.`); }
  if (!Number.isInteger(r.discovery.evaluations) || r.discovery.evaluations < 0 || r.discovery.evaluations > r.discovery.budget.maxEvaluations) fail('discovery.evaluations must be an integer within 0..budget.maxEvaluations.');
  if (!KEEPABLE_STATUSES.includes(r.discovery.statusAtDiscovery)) fail('discovery.statusAtDiscovery is not a keepable status.');
  const keptKeys = Object.keys(r.kept ?? {}).sort().join();
  if (keptKeys !== 'at' && keptKeys !== 'at,title') fail('kept must have at, and optionally title.');
  if (!isoTime(r.kept.at)) fail('kept.at must be an ISO-8601 UTC time of the form YYYY-MM-DDTHH:MM:SS.sssZ.');
  if ('title' in r.kept && (typeof r.kept.title !== 'string' || !r.kept.title.length || r.kept.title.length > KEPT_TITLE_MAX)) fail(`kept.title must be 1..${KEPT_TITLE_MAX} characters.`);
  return r;
}

/** Sorted-key JSON after validation; the identity of a kept candidate. */
export function canonicalInverseCandidate(record) { validateInverseCandidate(record); return JSON.stringify(sortKeys(JSON.parse(JSON.stringify(record)))); }
export async function inverseCandidateSha256(record) { return sha256Hex(canonicalInverseCandidate(record)); }

/** Validate, then recompute residual and status from grove and target. Returns a frozen result or throws; nothing in the record sets the status.
 * A consistently edited grove reopens as a different fit with its own recomputed residual; no authenticity is claimed. Keeping again after
 * reopening keeps `result.record` itself (the original declaration and kept time), never a fabricated search report. */
export function reopenInverseCandidate(input) {
  validateInverseCandidate(input);                                       // validate the input itself first: a JSON copy would turn NaN or Infinity into null and drop undefined extras
  const record = validateInverseCandidate(JSON.parse(JSON.stringify(input)));
  const residual = residualAgainstTarget(record.grove, record.target);
  const withinTolerance = residual.maxAbsCents <= record.tolerance.cents && Math.abs(residual.decayRelative) <= record.tolerance.decayRelative;
  const masses = record.grove.bodies.map(b => b.mass), equalMasses = masses.every(m => m === masses[0]);   // the bound follows the saved masses, never an assumed prior
  const bound = familyRatioBound({ equalMasses }), ratio = record.target.normalFrequenciesHz[2] / record.target.normalFrequenciesHz[0];
  const candidate = { source: 'kept', topology: record.grove.topology, baseMidi: record.grove.cluster.baseMidi, status: withinTolerance ? 'within-tolerance' : 'outside-tolerance', grove: record.grove, residual, evaluations: null, declared: { ...record.discovery, keptAt: record.kept.at, ...(record.kept.title ? { title: record.kept.title } : {}) } };
  return deepFreeze({ record, candidate, bound: { familyRatioBound: bound, equalMasses, targetRatio: ratio, exactRatioExceedsBound: ratio > bound } });
}
