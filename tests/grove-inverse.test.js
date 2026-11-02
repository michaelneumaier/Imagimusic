import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, groveSystem, canonicalGrove, validateGrove } from '../src/score/grove.js';
import { searchThreeResonanceGroves, validateInverseTarget, familyRatioBound } from '../src/score/grove-inverse.js';

const equalMassGrove = seed => { const g = JSON.parse(canonicalGrove(composeGrove({ seed }))); g.bodies.forEach(b => { b.mass = 0.02; }); return validateGrove(g); };
const targetFrom = (g, provenance) => { const s = groveSystem(g); return { version: 1, kind: 'three-resonance', normalFrequenciesHz: s.normalFreqsHz.slice(), decaySeconds: s.decayS, provenance }; };

test('a feasible target from a known canonical equal-mass Grove is reached within tolerance, independently checked through groveSystem', () => {
  const source = equalMassGrove(3), target = targetFrom(source, 'groveSystem of composeGrove seed 3 with equal masses 0.02 (synthetic)');
  const frozen = JSON.stringify(target), report = searchThreeResonanceGroves(target, { topologies: ['triangle'], budget: { restarts: 4, iterations: 300 }, seed: 7 });
  assert.equal(JSON.stringify(target), frozen, 'the target is not mutated'); assert.deepEqual(report.target, target);
  const c = report.candidates[0]; assert.equal(c.status, 'accepted', JSON.stringify(c.residual));
  const check = groveSystem(validateGrove(c.grove));
  check.normalFreqsHz.forEach((f, i) => assert.ok(Math.abs(1200 * Math.log2(f / target.normalFrequenciesHz[i])) <= 2, `mode ${i} within 2 cents: ${f} vs ${target.normalFrequenciesHz[i]}`));
  assert.ok(Math.abs(check.decayS / target.decaySeconds - 1) <= 0.05); assert.equal(c.grove.cluster.baseMidi, source.cluster.baseMidi);
  assert.equal(report.verdict.startsWith('accepted'), true); assert.ok(report.fitted.length === 2 && report.excluded.length >= 5 && report.model.includes('coupledNetwork'));
  const again = searchThreeResonanceGroves(target, { topologies: ['triangle'], budget: { restarts: 4, iterations: 300 }, seed: 7 });
  assert.deepEqual(again, report, 'deterministic for a seed and budget');
});

test('an unreachable 1 : 2 : 3 target is impossible by the independent bound, and the best residual is still reported', () => {
  const target = { version: 1, kind: 'three-resonance', normalFrequenciesHz: [130, 260, 390], decaySeconds: 2, provenance: 'authored, deliberately outside the family' };
  const report = searchThreeResonanceGroves(target, { budget: { restarts: 2, iterations: 100 }, seed: 3 });
  assert.ok(familyRatioBound() < 1.13 && familyRatioBound() > 1.12); assert.ok(report.bound.targetRatio > report.bound.familyRatioBound);
  assert.equal(report.verdict.startsWith('impossible-in-family'), true);
  for (const c of report.candidates) { assert.equal(c.status, 'impossible-in-family'); assert.ok(Number.isFinite(c.residual.maxAbsCents) && c.residual.maxAbsCents > 100, 'best residual reported, and large'); validateGrove(c.grove); }
});

test('a reachable but tight target reports best-outside-tolerance rather than claiming a fit, and never a proof of impossibility', () => {
  const source = equalMassGrove(7), target = targetFrom(source, 'groveSystem of composeGrove seed 7 with equal masses (synthetic)');
  const report = searchThreeResonanceGroves(target, { topologies: ['chain'], tolerance: { cents: 1e-9, decayRelative: 1e-9 }, budget: { restarts: 1, iterations: 20 }, seed: 5 });
  assert.equal(report.candidates[0].status, 'best-outside-tolerance'); assert.equal(report.verdict.startsWith('no feasible fit found within the search budget'), true);
});

test('refusals: malformed targets, out-of-range frequencies, decays outside the loss bounds, budget overflow, unknown topology and options', () => {
  const ok = { version: 1, kind: 'three-resonance', normalFrequenciesHz: [128, 131, 132], decaySeconds: 2.4, provenance: 'authored' };
  validateInverseTarget(ok);
  assert.throws(() => validateInverseTarget({ ...ok, normalFrequenciesHz: [131, 128, 132] }), /ascending/);
  assert.throws(() => validateInverseTarget({ ...ok, normalFrequenciesHz: [128, Infinity, 132] }), /finite positive/);
  assert.throws(() => validateInverseTarget({ ...ok, normalFrequenciesHz: [10, 11, 12] }), /outside the family/);
  assert.throws(() => validateInverseTarget({ ...ok, extra: 1 }), /unsupported field/);
  assert.throws(() => searchThreeResonanceGroves({ ...ok, decaySeconds: 100 }), /outside the family's/);
  assert.throws(() => searchThreeResonanceGroves(ok, { budget: { restarts: 1000, iterations: 10 } }), /budget/);
  assert.throws(() => searchThreeResonanceGroves(ok, { topologies: ['ring'] }), /topologies/);
  assert.throws(() => searchThreeResonanceGroves(ok, { nope: 1 }), /unknown option/);
  assert.throws(() => searchThreeResonanceGroves(ok, { baseMidi: 49 }), /garden note/);
});
