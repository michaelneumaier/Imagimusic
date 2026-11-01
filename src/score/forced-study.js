// The powered-driver study (proposal 020 B, Astra's brief 2026-11-01): an exogenous sample-held sinusoidal force at one existing strike
// coordinate for a stated time, then removed, rendered three ways with an identical force history: free, a firm hand on the driven body,
// the same hand on its bridged neighbour. Offline only; the artifact is its own kind and never a Rest record (a Rest record cannot
// reconstruct forcing). Amplitude is declared from Astra's energy budget before rendering; predicted bound and observed peak are reported
// separately; nothing is boosted or limited afterwards. Not a bow, hand, breath or actuator; no claim of appeal.
import { voiceSystem } from './grove-voice.js';
import { forcedStepper, stateEnergy } from '../coupling.js';
import { REST_STRENGTHS } from './grove-rest.js';

export const FORCED_STUDY_KIND = 'imagimusic-forced-study', FORCED_STUDY_VERSION = 1;

/** Declare the study: driver, budget and the three cases. Pure; no rendering. */
export function composeForcedStudy(recipe, { body = 0, position = 1, frequencyHz, forceSeconds = 2, ringSeconds = 3, ceilingFraction = 0.5, strength = 'firm' } = {}) {
  const g = recipe.grove;
  if (!Number.isInteger(body) || body < 0 || body >= recipe.bodies) throw new Error('body must index the grove.');
  if (!Number.isInteger(position) || position < 0 || position >= recipe.positions.length) throw new Error('position must index the recipe positions.');
  for (const [name, v, lo, hi] of [['forceSeconds', forceSeconds, 0.05, 30], ['ringSeconds', ringSeconds, 0, 60], ['ceilingFraction', ceilingFraction, 0.01, 1]]) if (!Number.isFinite(v) || v < lo || v > hi) throw new Error(`${name} must be a finite number in ${lo}..${hi}.`);
  const hz = frequencyHz ?? g.bodies[body].hz; if (!Number.isFinite(hz) || hz <= 0 || hz >= recipe.sampleRate / 2) throw new Error('frequencyHz must be positive and below Nyquist.');
  const strengthIndex = recipe.strengths.findIndex(st => st.name === strength); if (strengthIndex < 0) throw new Error(`strength ${strength} is not in the recipe.`);
  const bridge = g.bridges.find(e => e.a === body || e.b === body); if (!bridge) throw new Error('the body needs a bridge.');
  const neighbor = bridge.a === body ? bridge.b : bridge.a, tip = recipe.zones.length - 1;
  const direction = recipe.strikeVectors[position][body], directionNorm = Math.sqrt(direction.reduce((a, v) => a + v * v, 0)), fmax = Math.max(...recipe.energyFactors);
  // Budget (Astra): √(2E(t)) ≤ √(2E₀) + ‖b‖∫|f|; with E₀ = 0 and ∫|f| = A·T·2/π for a sinusoid, the output ceiling G·fmax·‖b‖·A·T·2/π ≤ ceilingFraction·admissionCeiling.
  const integralPerUnitAmplitude = forceSeconds * 2 / Math.PI, amplitude = ceilingFraction * recipe.admissionCeiling / (recipe.outputGain * fmax * directionNorm * integralPerUnitAmplitude);
  const predictedBound = recipe.outputGain * fmax * directionNorm * amplitude * integralPerUnitAmplitude;
  const contact = { body: null, zone: tip, strength: strengthIndex };
  return {
    version: FORCED_STUDY_VERSION, kind: FORCED_STUDY_KIND, grove: g, voice: recipe.voice, sampleRate: recipe.sampleRate, zones: recipe.zones, strengths: recipe.strengths.map(st => ({ name: st.name, c: st.c })), outputGain: recipe.outputGain,
    driver: { body, position, u: recipe.positions[position], frequencyHz: hz, amplitude, forceSeconds, ringSeconds, law: 'sample-held sinusoid f_n = A·sin(2π·f·n/sr) for n < forceSeconds·sr, then 0; exact affine zero-order-hold evolution x ← Φx + Γf; a powered driver, not a bow, hand, breath or actuator',
      units: 'A in newtons applied along the unit strike direction b = φ(u)/√m (mass-normalized velocity rows); pickups and gain as the Rest recipe', budget: { ceilingFraction, admissionCeiling: recipe.admissionCeiling, directionNorm, energyFactorMax: fmax, integralAbsForce: amplitude * integralPerUnitAmplitude, predictedOutputBound: predictedBound, statement: '√(2E(t)) ≤ √(2E₀) + ‖b‖∫|f|, E₀ = 0; |out| ≤ outputGain·fmax·√(2E); the amplitude is chosen so this bound is ceilingFraction of the admission ceiling; it is conservative and not perceptual loudness' } },
    cases: [{ id: 'free', contacts: [] }, { id: 'hand-on-driven', contacts: [{ ...contact, body }] }, { id: 'hand-on-neighbor', contacts: [{ ...contact, body: neighbor }] }],
    neighbor, interpretation: 'three renders of one identical force history under three contact states; what differs is the instrument, never the source; measurements describe the files and claim nothing about hearing',
  };
}

/** Render every case: PCM, and measurements that report the predicted bound and the observed peak separately. */
export function renderForcedStudy(study, { traceHz = 60 } = {}) {
  if (!Number.isFinite(traceHz) || traceHz < 1 || traceHz > 1000) throw new Error('traceHz must be in 1..1000.');
  if (study?.kind !== FORCED_STUDY_KIND || study.version !== FORCED_STUDY_VERSION) throw new Error('not a forced study.');
  const { system } = voiceSystem(study.grove, study.voice), sr = study.sampleRate, d = study.driver;
  // Rebuild the direction and the pickups exactly as the recipe does, from the study's own grove and voice (no recipe object is stored).
  const n = system.n, dim = 2 * n, direction = new Float64Array(dim), w = system.snapshot[d.body].shape(d.u);
  for (let j = 0; j < system.sizes[d.body]; j++) direction[n + system.offsets[d.body] + j] = w[j] / Math.sqrt(system.snapshot[d.body].mass);
  const pans = study.grove.layout.map(({ x }) => [Math.cos((x + 1) * Math.PI / 4) / Math.sqrt(study.grove.bodies.length), Math.sin((x + 1) * Math.PI / 4) / Math.sqrt(study.grove.bodies.length)]);
  // pickupScale is a recipe quantity; recover it from the stored outputGain-independent convention by rebuilding the recipe lazily would cost the matrices,
  // so the study stores pickup vectors explicitly when rendered the first time.
  const pickups = study.pickupVectors ?? (() => { throw new Error('study.pickupVectors missing: compose with attachPickups(recipe) first.'); })();
  const forcedFrames = Math.round(d.forceSeconds * sr), total = forcedFrames + Math.round(d.ringSeconds * sr), results = [];
  const forceAt = i => (i < forcedFrames ? d.amplitude * Math.sin(2 * Math.PI * d.frequencyHz * i / sr) : 0);
  for (const c of study.cases) {
    const contacts = c.contacts.map(k => ({ body: k.body, u: study.zones[k.zone], c: study.strengths[k.strength].c }));
    const st = forcedStepper(system, { contacts, sampleRate: sr, direction }), channels = [new Float32Array(total), new Float32Array(total)];
    let x = new Float64Array(dim), next = new Float64Array(dim), integral = 0, peak = 0, peakBoundRatio = 0, maxEnergy = 0, eForced = 0, eRing = 0, lowAtRelease = 0;
    const traceEvery = Math.max(1, Math.round(sr / traceHz)), trace = { hz: sr / traceEvery, times: [], energy: [], sqrt2E: [], budgetSqrt2E: [], force: [] };
    for (let i = 0; i < total; i++) {
      let l = 0, r = 0; for (let k = 0; k < n; k++) { l += pickups[0][k] * x[k]; r += pickups[1][k] * x[k]; }
      const out0 = study.outputGain * l, out1 = study.outputGain * r; channels[0][i] = out0; channels[1][i] = out1;
      const a = Math.max(Math.abs(out0), Math.abs(out1)); peak = Math.max(peak, a); if (i < forcedFrames) eForced += out0 * out0 + out1 * out1; else eRing += out0 * out0 + out1 * out1;
      const f = forceAt(i); st.stepInto(x, f, next); const t = x; x = next; next = t; integral += Math.abs(f) / sr;
      const E = stateEnergy(system, x); maxEnergy = Math.max(maxEnergy, E);
      const bound = study.outputGain * d.budget.energyFactorMax * st.directionNorm * integral; if (bound > 0) peakBoundRatio = Math.max(peakBoundRatio, Math.sqrt(2 * E) * study.outputGain * d.budget.energyFactorMax / bound);
      if (i === forcedFrames - 1) lowAtRelease = a;
      if (i % traceEvery === 0) { trace.times.push(i / sr); trace.energy.push(E); trace.sqrt2E.push(Math.sqrt(2 * E)); trace.budgetSqrt2E.push(st.directionNorm * integral); trace.force.push(f); }
    }
    results.push({ id: c.id, contacts: c.contacts, observedPeak: peak, predictedOutputBound: d.budget.predictedOutputBound, boundRatioMax: peakBoundRatio, rmsForced: Math.sqrt(eForced / (2 * forcedFrames)), rmsRing: Math.sqrt(eRing / (2 * Math.max(1, total - forcedFrames))), maxEnergy, peakAtRelease: lowAtRelease, trace, pcm: { sampleRate: sr, channels } });
  }
  return { frames: total, forcedFrames, releaseFrame: forcedFrames, markers: { forceActive: [0, forcedFrames / sr], released: [forcedFrames / sr, total / sr] }, cases: results };
}

/** Attach the recipe's pickup vectors to a study so renderForcedStudy needs no recipe (they are small, and they define the sound exactly as the Rest route does). */
export const attachPickups = (study, recipe) => ({ ...study, pickupVectors: recipe.pickupVectors.map(v => v.slice()) });
export { REST_STRENGTHS };
