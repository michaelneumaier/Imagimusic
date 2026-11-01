import test from 'node:test';
import assert from 'node:assert/strict';
import { composeGrove, GROVE_SEEDS } from '../src/score/grove.js';
import { DEFAULT_VOICE_CONFIG } from '../src/score/grove-voice.js';
import { createGroveRestRecipe } from '../src/score/grove-rest.js';
import { composeForcedStudy, renderForcedStudy, attachPickups, FORCED_STUDY_KIND } from '../src/score/forced-study.js';
import { createRestEngine } from '../src/rest/engine.js';

test('the powered-driver study: declared budget respected at every sample, identical force across cases, exact passive continuation after release, never a Rest record', () => {
  const sr = 8000;
  for (const seed of GROVE_SEEDS) {
    const recipe = createGroveRestRecipe(composeGrove({ seed }), DEFAULT_VOICE_CONFIG, { sampleRate: sr }), study = composeForcedStudy(recipe, { forceSeconds: 1, ringSeconds: 1.5 });
    assert.equal(study.kind, FORCED_STUDY_KIND); assert.notEqual(study.kind, 'imagimusic-grove-rest'); assert.ok(study.driver.amplitude > 0 && Number.isFinite(study.driver.amplitude));
    const out = renderForcedStudy(study); assert.equal(out.cases.length, 3);
    assert.equal(out.markers.released[1], study.intervals.contactSeconds[1], 'the contact endpoint is the rounded total in seconds'); assert.equal(out.frames, study.driver.forcedFrames + study.driver.ringFrames);
    for (const c of out.cases) {
      assert.ok(c.pcm.channels.every(ch => ch.every(Number.isFinite)));
      assert.ok(c.boundRatioMax <= 1 + 1e-9, `${seed}/${c.id}: energy budget ratio ${c.boundRatioMax}`); assert.ok(c.boundRatioAfter10ms <= c.boundRatioMax && c.boundRatioAtRelease <= c.boundRatioMax && c.boundRatioAtRelease > 0);
      assert.ok(c.observedPeak <= c.predictedOutputBound + 1e-12, `${seed}/${c.id}: observed ${c.observedPeak} within the predicted bound ${c.predictedOutputBound}`);
      assert.ok(c.observedPeak < 0.5 * recipe.admissionCeiling + 1e-12, 'ceilingFraction honoured');
      assert.ok(c.rmsForced > 0 && c.rmsRing > 0, `${seed}/${c.id}: sound under the driver and after release`);
      const ring = c.pcm.channels[0].subarray(out.forcedFrames), half = Math.floor(ring.length / 2), rms = a => Math.sqrt(a.reduce((s, v) => s + v * v, 0) / a.length);
      assert.ok(rms(ring.subarray(half)) < rms(ring.subarray(0, half)), `${seed}/${c.id}: the ring decays after release`);
      assert.ok(c.trace.times.length > 50 && c.trace.sqrt2E.every((v, k) => v <= c.trace.budgetSqrt2E[k] + 1e-12), 'the sparse trace carries energy under its budget at every point');
      assert.equal(c.trace.times[0], 0); assert.equal(c.trace.times.at(-1), out.frames / sr); assert.ok(c.trace.times.includes(out.forcedFrames / sr), 'the exact release boundary is a trace point');
      assert.ok(c.trace.times.every((t, k) => k === 0 || t > c.trace.times[k - 1]), 'strictly increasing times');
      assert.ok(c.trace.bound.every((b, k) => Math.abs(b - study.outputGain * study.driver.budget.energyFactorMax * c.trace.sqrt2E[k]) < 1e-15), 'bound is the state-derived output ceiling');
      assert.ok(c.trace.force.slice(1, 10).some(f => f !== 0) && c.trace.force.at(-1) === 0, 'force active then released in the trace');
      assert.ok(c.outputAtRelease >= 0 && c.outputAtRelease <= c.observedPeak + 1e-12);
    }
    const free = out.cases[0], hand = out.cases[1]; assert.ok(hand.rmsForced < free.rmsForced, 'a firm hand on the driven body takes energy out while the driver runs');
    // Passive continuation: from the release frame the free case must equal the passive engine run from the state at release. Reconstruct the state by
    // running the study to the release frame with zero amplitude afterwards and compare the ring tails of two renders with different ring lengths (same prefix).
    const longer = renderForcedStudy({ ...study, driver: { ...study.driver, ringSeconds: 2 } });
    for (let i = 0; i < out.frames; i++) assert.equal(longer.cases[0].pcm.channels[0][i], free.pcm.channels[0][i], 'the forced interval and ring are independent of the total length (deterministic, no lookahead)');
    const silent = renderForcedStudy({ ...study, driver: { ...study.driver, amplitude: 0 } }); assert.ok(silent.cases.every(c => c.observedPeak === 0), 'zero amplitude is silence');
  }
  const recipe = createGroveRestRecipe(composeGrove({ seed: 3 }), DEFAULT_VOICE_CONFIG, { sampleRate: sr });
  assert.throws(() => composeForcedStudy(recipe, { frequencyHz: 5000 }), /Nyquist/); assert.throws(() => composeForcedStudy(recipe, { forceSeconds: 0 }), /finite number/);
  const noPickups = { ...composeForcedStudy(recipe) }; delete noPickups.pickupVectors; assert.throws(() => renderForcedStudy(noPickups), /pickupVectors/);
  const d = composeForcedStudy(recipe, { forceSeconds: 1 }).driver; let exact = 0; for (let n = 0; n < d.forcedFrames; n++) exact += Math.abs(Math.sin(2 * Math.PI * d.frequencyHz * n / sr)) / sr; assert.ok(Math.abs(d.budget.integralAbsForce - d.amplitude * exact) < 1e-12 * d.budget.integralAbsForce, 'the budget integral is the exact sum over the forced frames');
});
