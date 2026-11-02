import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, groveSystem } from '../src/score/grove.js';
import { searchThreeResonanceGroves, residualAgainstTarget } from '../src/score/grove-inverse.js';
import { keepInverseCandidate, validateInverseCandidate, canonicalInverseCandidate, inverseCandidateSha256, reopenInverseCandidate, KEPT_CANDIDATE_KIND } from '../src/score/grove-inverse-kept.js';

const source = composeGrove({ seed: 3 }); source.bodies.forEach(b => b.mass = .02);
const s = groveSystem(source);
const target = { version: 1, kind: 'three-resonance', normalFrequenciesHz: s.normalFreqsHz.map(f => Number(f.toFixed(6))), decaySeconds: Number(s.decayS.toFixed(8)), provenance: 'Known seed 3, equal 0.02 kg masses, rounded declared target' };
const report = searchThreeResonanceGroves(target, { baseMidi: 48, seed: 19, budget: { restarts: 2, iterations: 120, maxEvaluations: 20000 } });
const at = '2026-11-02T08:30:00.000Z';
const clone = v => JSON.parse(JSON.stringify(v));

test('keep, canonicalise and reopen both default candidates: residual recomputed to the solver\'s own value, same hash, no stored status', async () => {
  for (const [index, c] of report.candidates.entries()) {
    if (!c.grove) continue;
    const kept = keepInverseCandidate(report, index, { at, title: `${c.topology} for seed 3` });
    assert.equal(kept.kind, KEPT_CANDIDATE_KIND); assert.ok(Object.isFrozen(kept) && Object.isFrozen(kept.grove));
    assert.ok(!('residual' in kept) && !('status' in kept), 'residual and status are never stored');
    const text = canonicalInverseCandidate(kept), again = JSON.parse(text);
    assert.equal(canonicalInverseCandidate(again), text, 'canonical form is a fixed point');
    assert.equal(await inverseCandidateSha256(again), await inverseCandidateSha256(kept));
    const opened = reopenInverseCandidate(again);
    const expected = residualAgainstTarget(c.grove, target);
    assert.ok(Math.abs(opened.candidate.residual.maxAbsCents - expected.maxAbsCents) < 1e-12 && Math.abs(opened.candidate.residual.decayRelative - expected.decayRelative) < 1e-12);
    assert.equal(opened.candidate.status, c.status === 'accepted' ? 'within-tolerance' : 'outside-tolerance');
    assert.equal(opened.candidate.source, 'kept'); assert.equal(opened.candidate.topology, c.topology); assert.equal(opened.candidate.evaluations, null);
    assert.equal(opened.candidate.declared.statusAtDiscovery, c.status); assert.equal(opened.candidate.declared.keptAt, at);
    assert.ok(Object.isFrozen(opened) && Object.isFrozen(opened.candidate.grove));
  }
});

test('refusals: edited frequency changes the recomputed residual and never the stored claim; residual field, changed model, bad target, bad time, foreign kind, extra fields, unkeepable candidate', () => {
  const index = report.candidates.findIndex(c => c.grove); const kept = keepInverseCandidate(report, index, { at });
  const inconsistent = clone(kept); inconsistent.grove.bodies[1].hz = Number((inconsistent.grove.bodies[1].hz * 2 ** (30 / 1200)).toFixed(3));
  assert.throws(() => reopenInverseCandidate(inconsistent), /does not follow from the cluster base/);
  // a consistent edit (cents and hz together) is a valid Grove and reopens as a different fit: the recomputed residual reports it, no claim is trusted
  const edited = clone(kept); const body = edited.grove.bodies[1]; body.cents = Number((body.cents + 30).toFixed(1)); body.hz = Number((edited.grove.cluster.baseHz * 2 ** (body.cents / 1200)).toFixed(3));
  const opened = reopenInverseCandidate(edited); assert.ok(opened.candidate.residual.maxAbsCents > 1, 'edited grove shows a large recomputed residual'); assert.equal(opened.candidate.status, 'outside-tolerance');
  const unequal = clone(kept); unequal.grove.bodies[2].mass = 0.04; const openedUnequal = reopenInverseCandidate(unequal);
  assert.equal(openedUnequal.bound.equalMasses, false); assert.ok(openedUnequal.bound.familyRatioBound > reopenInverseCandidate(kept).bound.familyRatioBound, 'the bound follows the saved masses');
  const otherFade = clone(kept); otherFade.model.fadeSeconds = 0.05; assert.throws(() => validateInverseCandidate(otherFade), /model identity differs .*fadeSeconds/);
  const otherRevision = clone(kept); otherRevision.model.instrumentRevision = 2; assert.throws(() => validateInverseCandidate(otherRevision), /instrumentRevision/);
  const zeroTolerance = clone(kept); zeroTolerance.tolerance.cents = 0; assert.throws(() => validateInverseCandidate(zeroTolerance), /positive/);
  const stringPickups = clone(kept); stringPickups.model.pickupBodies = ['0', '2']; assert.throws(() => validateInverseCandidate(stringPickups), /pickupBodies/);
  const sparsePickups = clone(kept); sparsePickups.model.pickupBodies = new Array(2); assert.throws(() => validateInverseCandidate(sparsePickups), /pickupBodies/); assert.throws(() => canonicalInverseCandidate(sparsePickups), /pickupBodies/);
  const holePickups = clone(kept); holePickups.model.pickupBodies = [0, , 2].slice(0, 2); holePickups.model.pickupBodies.length = 2; assert.throws(() => validateInverseCandidate(holePickups), /pickupBodies/);
  const fractionalBudget = clone(kept); fractionalBudget.discovery.budget.restarts = 2.5; assert.throws(() => validateInverseCandidate(fractionalBudget), /budget.restarts must be an integer/);
  const tooManyEvaluations = clone(kept); tooManyEvaluations.discovery.evaluations = tooManyEvaluations.discovery.budget.maxEvaluations + 1; assert.throws(() => validateInverseCandidate(tooManyEvaluations), /0\.\.budget\.maxEvaluations/);
  const bigSeed = clone(kept); bigSeed.discovery.seed = 4294967296; assert.throws(() => validateInverseCandidate(bigSeed), /4294967295/);
  const looseDate = clone(kept); looseDate.kept.at = 'Nov 2 2026'; assert.ok(!Number.isNaN(Date.parse(looseDate.kept.at)), 'Date.parse alone would admit it'); assert.throws(() => validateInverseCandidate(looseDate), /YYYY-MM-DD/);
  const nanInput = clone(kept); nanInput.tolerance.cents = NaN; assert.throws(() => reopenInverseCandidate(nanInput), /finite/);
  const undefinedExtra = { ...clone(kept), strikes: undefined }; assert.throws(() => reopenInverseCandidate(undefinedExtra), /exactly the fields/);
  assert.throws(() => keepInverseCandidate({ ...report, seed: NaN }, index, { at }), /seed must be an integer/);
  const withResidual = { ...clone(kept), residual: { maxAbsCents: 0 } }; assert.throws(() => validateInverseCandidate(withResidual), /exactly the fields/);
  const withStatus = clone(kept); withStatus.discovery.statusAtDiscovery = 'best-found'; assert.throws(() => validateInverseCandidate(withStatus), /keepable status/);
  const otherModel = clone(kept); otherModel.model.outputGain = 9; assert.throws(() => validateInverseCandidate(otherModel), /model identity differs/);
  const otherPickups = clone(kept); otherPickups.model.pickupBodies = [0, 1]; assert.throws(() => validateInverseCandidate(otherPickups), /model identity differs/);
  const badTarget = clone(kept); badTarget.target.normalFrequenciesHz = [200, 150, 300]; assert.throws(() => validateInverseCandidate(badTarget));
  const badTime = clone(kept); badTime.kept.at = 'yesterday'; assert.throws(() => validateInverseCandidate(badTime), /ISO-8601/);
  const foreign = { ...clone(kept), kind: 'imagimusic-grove-ensemble-seeded' }; assert.throws(() => validateInverseCandidate(foreign), /kind must be/);
  const extra = { ...clone(kept), strikes: [] }; assert.throws(() => validateInverseCandidate(extra), /exactly the fields/);
  const baseMismatch = clone(kept); baseMismatch.discovery.baseMidi = baseMismatch.grove.cluster.baseMidi + 3; assert.throws(() => validateInverseCandidate(baseMismatch), /cluster base/);
  assert.throws(() => keepInverseCandidate({ ...report, candidates: [{ topology: 'chain', status: 'no-admitted-candidate', evaluations: 0 }] }, 0, { at }), /no grove to keep/);
  assert.throws(() => keepInverseCandidate(report, index, { at: 'not a time' }), /ISO-8601/);
  assert.throws(() => keepInverseCandidate(report, index, { at, title: 'x'.repeat(81) }), /1\.\.80/);
  assert.throws(() => reopenInverseCandidate(null), /must be an object/);
});

test('the source report and the kept record are independent: mutating one never changes the other', () => {
  const index = report.candidates.findIndex(c => c.grove); const before = JSON.stringify(report.candidates[index].grove);
  const kept = keepInverseCandidate(report, index, { at });
  report.candidates[index].grove.loss = 1.5; assert.equal(JSON.stringify(kept.grove) !== JSON.stringify(report.candidates[index].grove), true);
  report.candidates[index].grove = JSON.parse(before);
  assert.throws(() => { kept.grove.loss = 0.9; }, TypeError);
});
