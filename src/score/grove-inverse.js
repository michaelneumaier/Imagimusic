// Bounded three-resonance design search in canonical Groves: given a declared target (three damped normal frequencies and one common
// decay), find admitted Groves of a fixed topology whose model (groveSystem → coupledNetwork: three lumped modes, one proportional loss)
// reproduces them within a tolerance. Fitted quantities: the three damped normal frequencies and the decay. Excluded: amplitudes, pickups,
// attack, strike positions, the voice layer's beam partials (grove-voice.js), and anything heard; matching resonances does not match a sound.
// Generic local underdetermination is expected (the map from tunings and couplings to three frequencies has rank at most 3); this search
// promises no global optimum and no uniqueness; it returns one admitted candidate per topology with its residual and a status.
import { NOTES, frequency } from '../model.js';
import { validateGrove, canonicalGrove, groveSystem, GROVE_VERSION, GROVE_BOUNDS, GROVE_TOPOLOGIES } from './grove.js';

export const INVERSE_VERSION = 1;
export const INVERSE_MODEL = 'groveSystem → coupledNetwork: three lumped masses with ground springs and bridge springs, one proportional loss; damped normal frequencies √(λ − γ²); beam partials of the voice layer not covered';
export const INVERSE_FITTED = Object.freeze(['normalFrequenciesHz (three damped normal frequencies)', 'decaySeconds (1/γ, the common proportional loss)']);
export const INVERSE_EXCLUDED = Object.freeze(['mode amplitudes and residues', 'pickup positions and scale', 'attack and strike position', 'masses (equal-mass prior; invisible to the spectrum under the Grove coupling recipe)', 'beam partials', 'anything heard']);
export const INVERSE_DEFAULTS = Object.freeze({ tolerance: Object.freeze({ cents: 2, decayRelative: 0.05 }), budget: Object.freeze({ restarts: 6, iterations: 300, maxEvaluations: 200000 }), seed: 1, mass: 0.02 });
// restarts and iterations bound one search (one base, one topology); maxEvaluations bounds the whole job across every base and topology, counted per model evaluation (each Nelder–Mead step costs at most a few).
export const INVERSE_LIMITS = Object.freeze({ restarts: 64, iterations: 5000, maxEvaluations: 2000000, topologies: 2 });
const EQUAL_MASS_LAMBDA_FACTOR = 1.16, FULL_MASS_LAMBDA_FACTOR = 1.64;   // Weyl + Gershgorin: λ_max ≤ (1 + 2·2·0.04·(m_max/m_min)) ω_max², λ_min ≥ ω_min² (bridge part positive semidefinite)

/** The largest damped-frequency ratio any admitted Grove can reach (equal masses by default); above it a target is impossible in this family, independently of any search. */
export function familyRatioBound({ equalMasses = true } = {}) {
  const factor = equalMasses ? EQUAL_MASS_LAMBDA_FACTOR : FULL_MASS_LAMBDA_FACTOR, cents = GROVE_BOUNDS.clusterCents, tol = 0.01 / GROVE_BOUNDS.hz[0], gammaTerm = (GROVE_BOUNDS.loss[1] / (2 * Math.PI * GROVE_BOUNDS.hz[0])) ** 2;
  return Math.sqrt(factor * (2 ** (cents / 1200) + tol) ** 2 / ((2 ** (-cents / 1200) - tol) ** 2 - gammaTerm));
}

const finitePositive = (v, what) => { if (!(typeof v === 'number' && Number.isFinite(v) && v > 0)) throw new Error(`${what} must be a finite positive number.`); return v; };
/** Strict target: version, kind, three ascending finite positive frequencies within the model's range, a decay within the loss bounds' reach, a bounded provenance string. */
export function validateInverseTarget(target) {
  if (!target || typeof target !== 'object' || Array.isArray(target)) throw new Error('target must be an object.');
  for (const k of Object.keys(target)) if (!['version', 'kind', 'normalFrequenciesHz', 'decaySeconds', 'provenance'].includes(k)) throw new Error(`target: unsupported field "${k}".`);
  if (target.version !== INVERSE_VERSION || target.kind !== 'three-resonance') throw new Error('target must be a version-1 three-resonance target.');
  const f = target.normalFrequenciesHz; if (!Array.isArray(f) || f.length !== 3) throw new Error('normalFrequenciesHz must list three frequencies.');
  for (let i = 0; i < 3; i++) { finitePositive(f[i], `normalFrequenciesHz[${i}]`); if (i && !(f[i] > f[i - 1])) throw new Error('normalFrequenciesHz must be strictly ascending.'); }   // by index: a sparse array cannot slip through
  if (f[0] < GROVE_BOUNDS.hz[0] * 2 ** (-GROVE_BOUNDS.clusterCents / 1200) || f[2] > GROVE_BOUNDS.hz[1] * 1.2) throw new Error('normalFrequenciesHz lie outside the family\'s frequency range.');
  finitePositive(target.decaySeconds, 'decaySeconds');
  if (typeof target.provenance !== 'string' || !target.provenance.length || target.provenance.length > 200) throw new Error('provenance must say where the target comes from (1..200 characters).');
  return target;
}

// Deterministic generator (same recipe as composeGrove's rng), kept local so the search cannot depend on anything but its seed.
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const round = (v, d) => Math.round(v * 10 ** d) / 10 ** d, clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const centsBounds = [-GROVE_BOUNDS.clusterCents, GROVE_BOUNDS.clusterCents];
/** Garden notes ordered by distance in cents from a frequency (a sorted copy; NOTES is never mutated). */
export const baseOrder = hz => [...NOTES].sort((a, b) => Math.abs(1200 * Math.log2(frequency(a) / hz)) - Math.abs(1200 * Math.log2(frequency(b) / hz)) || a - b);

/** A canonical Grove from search coordinates (cents of bodies 1 and 2, one coupling per bridge), or null if the model refuses it. */
function candidateGrove({ baseMidi, topology, mass, loss }, x) {
  const baseHz = frequency(baseMidi), pairs = topology === 'chain' ? [[0, 1], [1, 2]] : [[0, 1], [1, 2], [0, 2]];
  const cents = [0, round(clamp(x[0], centsBounds), 1), round(clamp(x[1], centsBounds), 1)];
  const bodies = cents.map((c, id) => ({ id, hz: round(baseHz * 2 ** (c / 1200), 3), cents: c, mass }));
  const bridges = pairs.map(([a, b], i) => ({ a, b, coupling: round(clamp(x[2 + i], GROVE_BOUNDS.coupling), 4) }));
  const layout = topology === 'chain' ? [{ x: -0.8, z: 0.1 }, { x: 0, z: -0.1 }, { x: 0.8, z: 0.1 }] : [90, 210, 330].map(deg => ({ x: round(0.75 * Math.cos(deg * Math.PI / 180), 4), z: round(0.75 * Math.sin(deg * Math.PI / 180), 4) }));
  try { return validateGrove({ version: GROVE_VERSION, seed: 0, topology, cluster: { baseMidi, baseHz: round(baseHz, 3) }, bodies, bridges, loss, layout }); } catch { return null; }
}
const centsError = (achieved, target) => achieved.map((f, i) => 1200 * Math.log2(f / target[i]));
function residualOf(grove, target) {
  const system = groveSystem(grove), cents = centsError(system.normalFreqsHz, target.normalFrequenciesHz), decayRelative = system.decayS / target.decaySeconds - 1;
  return { cents, maxAbsCents: Math.max(...cents.map(Math.abs)), decayRelative, achieved: { normalFrequenciesHz: system.normalFreqsHz.slice(), decaySeconds: system.decayS }, cost: cents.reduce((s, c) => s + c * c, 0) };
}

/** Bounded Nelder–Mead over the cents and couplings (loss is set directly from the decay), deterministic for a given seed and budget. */
function search(spec, target, budget, seed, work) {
  const dims = spec.topology === 'chain' ? 4 : 5, lo = [centsBounds[0], centsBounds[0], ...Array(dims - 2).fill(GROVE_BOUNDS.coupling[0])], hi = [centsBounds[1], centsBounds[1], ...Array(dims - 2).fill(GROVE_BOUNDS.coupling[1])];
  const random = rng(seed); let evaluations = 0, best = null;
  const cost = x => { if (work.used >= work.max) { work.exhausted = true; return Infinity; } work.used++; evaluations++; const g = candidateGrove(spec, x); if (!g) return Infinity; const r = residualOf(g, target); if (!best || r.cost < best.residual.cost) best = { grove: g, residual: r }; return r.cost; };
  for (let restart = 0; restart < budget.restarts && !work.exhausted; restart++) {
    let simplex = Array.from({ length: dims + 1 }, () => lo.map((l, i) => l + random() * (hi[i] - l))).map(x => ({ x, f: cost(x) }));
    for (let it = 0; it < budget.iterations && !work.exhausted; it++) {
      simplex.sort((a, b) => a.f - b.f); const worst = simplex[dims], centroid = lo.map((_, i) => simplex.slice(0, dims).reduce((s, p) => s + p.x[i], 0) / dims);
      const at = t => centroid.map((c, i) => clamp(c + t * (c - worst.x[i]), [lo[i], hi[i]]));
      const reflected = at(1), fr = cost(reflected);
      if (fr < simplex[0].f) { const expanded = at(2), fe = cost(expanded); simplex[dims] = fe < fr ? { x: expanded, f: fe } : { x: reflected, f: fr }; }
      else if (fr < simplex[dims - 1].f) simplex[dims] = { x: reflected, f: fr };
      else { const contracted = at(fr < worst.f ? 0.5 : -0.5), fc = cost(contracted); if (fc < Math.min(fr, worst.f)) simplex[dims] = { x: contracted, f: fc }; else simplex = simplex.map((p, i) => i ? { x: p.x.map((v, k) => simplex[0].x[k] + 0.5 * (v - simplex[0].x[k])), f: NaN } : p).map(p => Number.isNaN(p.f) ? { x: p.x, f: cost(p.x) } : p); }
      if (simplex[0].f < 1e-10) break;
    }
  }
  return { best, evaluations };
}

/** One candidate per requested topology, each with its residual and a status that never equates a search failure with impossibility. */
export function searchThreeResonanceGroves(targetInput, options = {}) {
  const target = JSON.parse(JSON.stringify(validateInverseTarget(targetInput)));
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('options must be an object.');
  for (const k of Object.keys(options)) if (!['topologies', 'baseMidi', 'tolerance', 'budget', 'seed', 'mass'].includes(k)) throw new Error(`unknown option "${k}".`);
  const strict = (value, defaults, name, isValid) => {                                      // a plain object with known numeric fields only; no coercion
    if (value === undefined) return { ...defaults };
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object.`);
    for (const k of Object.keys(value)) { if (!(k in defaults)) throw new Error(`${name}: unknown field "${k}".`); if (typeof value[k] !== 'number' || !isValid(k, value[k])) throw new Error(`${name}.${k} is out of range.`); }
    return { ...defaults, ...value };
  };
  const tolerance = strict(options.tolerance, INVERSE_DEFAULTS.tolerance, 'tolerance', (k, v) => Number.isFinite(v) && v > 0);
  const budget = strict(options.budget, INVERSE_DEFAULTS.budget, 'budget', (k, v) => Number.isInteger(v) && v >= 1 && v <= INVERSE_LIMITS[k]);
  const seed = options.seed ?? INVERSE_DEFAULTS.seed, mass = options.mass ?? INVERSE_DEFAULTS.mass;
  const topologies = options.topologies === undefined ? [...GROVE_TOPOLOGIES] : options.topologies;
  if (!Array.isArray(topologies) || !topologies.length || topologies.length > INVERSE_LIMITS.topologies || new Set(topologies).size !== topologies.length || topologies.some(t => !GROVE_TOPOLOGIES.includes(t))) throw new Error('topologies must be a list of at most two distinct names from chain and triangle.');
  if (typeof mass !== 'number') throw new Error('mass must be a number.');
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('seed must be an integer in 0..4294967295.');
  if (!(mass >= GROVE_BOUNDS.mass[0] && mass <= GROVE_BOUNDS.mass[1])) throw new Error('mass must lie within the Grove bounds.');
  if (options.baseMidi !== undefined && !NOTES.includes(options.baseMidi)) throw new Error('baseMidi must be a garden note.');
  const bases = options.baseMidi !== undefined ? [options.baseMidi] : baseOrder(target.normalFrequenciesHz[0]);
  // Loss from the decay directly (decayS = 1/γ): the only parameter that sets the decay; refused, not clamped, outside the bounds.
  const loss = 1 / target.decaySeconds; if (loss < GROVE_BOUNDS.loss[0] || loss > GROVE_BOUNDS.loss[1]) throw new Error(`decaySeconds ${target.decaySeconds} needs a loss of ${loss.toFixed(4)}, outside the family's ${GROVE_BOUNDS.loss[0]}..${GROVE_BOUNDS.loss[1]}.`);
  // Two bounds, kept apart: the exact target ratio against the family's exact bound, and the same against the bound widened by the cents tolerance
  // on both ends (2^(2·cents/1200)); only the second proves that no admitted Grove fits within tolerance. A candidate within tolerance is accepted
  // even when the exact ratio exceeds the exact bound, and the report says so.
  const ratio = target.normalFrequenciesHz[2] / target.normalFrequenciesHz[0], bound = familyRatioBound({ equalMasses: true }), toleranceWidenedBound = bound * 2 ** (2 * tolerance.cents / 1200);
  const exactRatioExceedsBound = ratio > bound, impossibleWithinTolerance = ratio > toleranceWidenedBound;
  const work = { used: 0, max: budget.maxEvaluations, exhausted: false };
  const candidates = topologies.map((topology, ti) => {
    // Bases in order of distance from the target's lowest frequency (a sorted copy; NOTES is never mutated); every base is tried unless the work budget runs out, and the best is kept.
    let bestOverall = null, evaluations = 0;
    for (const baseMidi of bases) { if (work.exhausted) break; const { best, evaluations: n } = search({ baseMidi, topology, mass, loss }, target, budget, (seed + 1000 * ti + baseMidi) >>> 0, work); evaluations += n; if (best && (!bestOverall || best.residual.cost < bestOverall.residual.cost)) bestOverall = { ...best, baseMidi }; }
    if (!bestOverall) return { topology, status: 'no-admitted-candidate', evaluations };
    const within = bestOverall.residual.maxAbsCents <= tolerance.cents && Math.abs(bestOverall.residual.decayRelative) <= tolerance.decayRelative;
    const status = within ? 'accepted' : impossibleWithinTolerance ? 'impossible-in-family' : 'best-outside-tolerance';
    const { cost, ...residual } = bestOverall.residual;
    return { topology, baseMidi: bestOverall.baseMidi, status, grove: JSON.parse(canonicalGrove(bestOverall.grove)), residual, evaluations };
  });
  return { version: INVERSE_VERSION, model: INVERSE_MODEL, fitted: [...INVERSE_FITTED], excluded: [...INVERSE_EXCLUDED], target, tolerance, budget, seed, mass, massPrior: 'equal masses; unidentifiable from the spectrum under the Grove coupling recipe (all-mass scaling leaves the normal frequencies unchanged)',
    work: { evaluations: work.used, maxEvaluations: work.max, exhausted: work.exhausted, note: 'restarts and iterations bound one search per base and topology; maxEvaluations bounds the whole job; when exhausted, remaining bases and topologies were not searched and the verdict is a budget verdict' },
    bound: { familyRatioBound: bound, toleranceWidenedBound, targetRatio: ratio, exactRatioExceedsBound, impossibleWithinTolerance, equalMasses: true, derivation: 'Weyl + Gershgorin on A = D + L with bridge weights ≤ 0.04 ω_max² and degree ≤ 2; λ_max ≤ 1.16 ω_max², λ_min ≥ ω_min²; ±40 cents, 0.01 Hz tolerance, γ ≤ 2 at 80 Hz' },
    verdict: candidates.some(c => c.status === 'accepted') ? 'accepted: at least one admitted candidate within tolerance (no uniqueness, no global optimum, nothing about the sound)' + (exactRatioExceedsBound ? '; the exact target ratio exceeds the exact family bound, so the fit is within tolerance, not exact' : '') : impossibleWithinTolerance ? 'impossible-in-family: the target\'s frequency ratio exceeds what any admitted equal-mass Grove can reach even with the cents tolerance (an independent bound, not a search failure); best residuals reported anyway' : work.exhausted ? 'no feasible fit found within the evaluation budget, which was exhausted before every base and topology was searched (not a proof of impossibility)' : 'no feasible fit found within the search budget (not a proof of impossibility)',
    candidates };
}
