import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, estimate, compare, smithMinimumWindow, cases, STUDY_DEFINITIONS } from '../tools/study-sound-file-target.mjs';

test('the sound-file study is reproducible: a lone decaying sine, the negative controls and the Smith prediction', () => {
  assert.ok(Object.isFrozen(STUDY_DEFINITIONS));
  const lone = synthesize({ modes: [{ hz: 220, amplitude: 1, decay: 2 }], seconds: 4 });
  for (const window of ['rect', 'hann']) { const r = estimate(lone.samples, lone.sampleRate, 1, { window }); const m = compare(r, [{ hz: 220, decay: 2 }]);
    assert.ok(m[0].matched && Math.abs(m[0].cents) < 0.5, `${window}: within half a cent`); assert.ok(Math.abs(m[0].decayErrorPct) < 2, `${window}: decay within 2 %`);
    if (window === 'hann') assert.equal(r.candidateCount, 1, 'hann: exactly one peak passes the study thresholds');
    else assert.ok(r.candidateCount > 1 && r.peaks[0].hz > 219 && r.peaks[0].hz < 221, 'rect: the true mode is strongest but sidelobes are also counted, so this threshold count is not a physical mode certificate'); }
  const two = synthesize({ modes: [{ hz: 150, amplitude: 1, decay: 2 }, { hz: 240, amplitude: 1, decay: 2 }], seconds: 8 });
  assert.equal(estimate(two.samples, two.sampleRate, 4, { window: 'hann' }).candidateCount, 2, 'a two-mode note gives exactly two candidates passing thresholds');
  const four = synthesize({ modes: [120, 160, 230, 310].map(hz => ({ hz, amplitude: 1, decay: 2 })), seconds: 8 });
  assert.equal(estimate(four.samples, four.sampleRate, 4, { window: 'hann' }).candidateCount, 4, 'a four-mode note reports four, never trimmed to three');
  const noise = synthesize({ modes: [{ hz: 1, amplitude: 1e-9, decay: 1 }], seconds: 8, noiseDb: 0 });
  assert.equal(estimate(noise.samples, noise.sampleRate, 4, { window: 'hann' }).candidateCount, 0, 'noise gives no candidate passing thresholds under the 20 dB floor');
  assert.deepEqual(Object.keys(smithMinimumWindow([{ hz: 200 }, { hz: 201 }, { hz: 300 }])), ['closestPairHz', 'twoCyclesSeconds', 'abeSmithSeconds']);
  assert.equal(smithMinimumWindow([{ hz: 200 }, { hz: 201 }]).twoCyclesSeconds, 2);
});

test('the default-style cluster: the rendered chain resolves all three only at 4 s under the rectangular window, and the Hann window never finds its weak middle mode', () => {
  const chain = cases()[0]; assert.equal(chain.truth.length, 3);
  const at = (W, window) => compare(estimate(chain.samples, chain.sampleRate, W, { window }), chain.truth).filter(t => t.matched).length;
  assert.equal(at(1, 'rect'), 2); assert.equal(at(4, 'rect'), 3); assert.equal(at(8, 'hann'), 2);
  const synthetic = cases()[1];
  assert.equal(compare(estimate(synthetic.samples, synthetic.sampleRate, 4, { window: 'hann' }), synthetic.truth).filter(t => t.matched && Math.abs(t.cents) < 1).length, 3, 'the equal-amplitude synthetic resolves at 4 s under Hann within a cent');
});

test('observation windows bound decay as well as spectrum unless explicitly separated', () => {
  const {samples, sampleRate} = synthesize({modes: [{hz:220, amplitude:1, decay:2}], seconds:2, sampleRate:8000});
  const prefix = samples.slice(0, sampleRate / 4);
  const short = estimate(prefix, sampleRate, .25, {window:'hann'});
  const full = estimate(samples, sampleRate, .25, {window:'hann'});
  assert.deepEqual(short.peaks, full.peaks);
  assert.equal(full.candidateCount, 0);
  assert.equal(full.supported, full.candidateCount);
  assert.equal(full.availableSeconds, 2);
  assert.equal(short.availableSeconds, .25);
  assert.equal(full.spectralWindowSeconds, .25);
  assert.equal(full.decayWindowSeconds, .25);
  assert.ok(full.peaks.every(p => p.decay === null && p.frames === 1));
  const extended = estimate(samples, sampleRate, .25, {window:'hann', decayWindowSeconds:8});
  assert.equal(extended.decayWindowSeconds, 2, 'explicit duration capped by available samples');
  assert.deepEqual(extended.peaks.map(p => p.hz), full.peaks.map(p => p.hz));
  assert.equal(extended.candidateCount, 1);
  assert.ok(Math.abs(extended.peaks[0].decay - 2) < .04);
  assert.throws(() => estimate(samples, sampleRate, NaN));
  assert.throws(() => estimate(samples, sampleRate, 1, {decayWindowSeconds:Infinity}));
});

test('truth matching cannot reuse a peak and maximizes assignment before minimizing cents', () => {
  const one = compare({mainLobeHz:2, peaks:[{hz:200.1, decay:2}]}, [{hz:200, decay:2}, {hz:201, decay:2}]);
  assert.equal(one.filter(t => t.matched).length, 1);
  assert.equal(one[0].peakIndex, 0);
  // The first truth prefers 101, but the second can only take 101.
  const found = {mainLobeHz:2, peaks:[{hz:101, decay:2}, {hz:98.5, decay:2}]};
  const matches = compare(found, [{hz:100, decay:2}, {hz:102, decay:2}]);
  assert.deepEqual(matches.map(m => m.peakIndex), [1, 0]);
  const minimum = compare({mainLobeHz:10, peaks:[{hz:101}, {hz:103}]}, [{hz:100}, {hz:104}]);
  assert.deepEqual(minimum.map(m => m.peakIndex), [0, 1], 'equal-cardinality matching minimizes total absolute cents');
  assert.deepEqual(compare(found, []), []);
  assert.equal(compare({mainLobeHz:2, peaks:[]}, [{hz:100}])[0].matched, false);
});
