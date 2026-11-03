import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreCandidates} from '../tools/study-sound-candidates.mjs';

test('candidate metrics match only threshold-passing peaks, without duplicating truth', () => {
  const peaks = [
    {hz:200, decay:2, aboveMedianDb:19, decayFitDb:0},
    {hz:201, decay:2.1, aboveMedianDb:40, decayFitDb:.2},
    {hz:300, decay:null, aboveMedianDb:50},
    {hz:400, decay:1, aboveMedianDb:30, decayFitDb:4},
  ];
  const score = scoreCandidates({mainLobeHz:2, peaks}, [{hz:200,decay:2},{hz:201,decay:2}]);
  assert.equal(score.candidates, 2);
  assert.equal(score.matched, 1);
  assert.equal(score.missed, 1);
  assert.equal(score.unmatchedCandidates, 1);
  assert.equal(score.accurateFrequency, 1);
  assert.equal(score.accurateDecay, 1);
  assert.deepEqual(score.residuals.map(r=>r.matched),[true,false]);
  assert.equal(score.matches[1].fitResidualDb,.2);
});

test('a small fit residual cannot certify a decay in a beating mixture', async () => {
  const {estimate, synthesize} = await import('../tools/study-sound-file-target.mjs');
  const truth = [{hz:200,decay:2},{hz:201,decay:.8},{hz:320,decay:3}];
  const signal = synthesize({modes:truth.map((m,i)=>({...m,amplitude:i===1?.1:1})),seconds:.5,sampleRate:8000});
  const score = scoreCandidates(estimate(signal.samples,8000,.5,{window:'hann'}),truth);
  const primary = score.matches[0];
  assert.ok(primary.matched);
  assert.ok(Math.abs(primary.cents) < .01);
  assert.ok(primary.fitResidualDb < .01);
  assert.ok(primary.decayErrorPct < -40, 'low residual coexists with a severely underestimated true decay');
});
