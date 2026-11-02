import test from 'node:test';
import assert from 'node:assert/strict';
import { synthesize, estimate, compare, smithMinimumWindow, cases, STUDY_DEFINITIONS } from '../tools/study-sound-file-target.mjs';

test('the sound-file study is reproducible: a lone decaying sine, the negative controls and the Smith prediction', () => {
  assert.ok(Object.isFrozen(STUDY_DEFINITIONS));
  const lone = synthesize({ modes: [{ hz: 220, amplitude: 1, decay: 2 }], seconds: 4 });
  for (const window of ['rect', 'hann']) { const r = estimate(lone.samples, lone.sampleRate, 1, { window }); const m = compare(r, [{ hz: 220, decay: 2 }]);
    assert.ok(m[0].matched && Math.abs(m[0].cents) < 0.5, `${window}: within half a cent`); assert.ok(Math.abs(m[0].decayErrorPct) < 2, `${window}: decay within 2 %`);
    if (window === 'hann') assert.equal(r.supported, 1, 'hann: exactly one supported mode, the evidence count');
    else assert.ok(r.supported > 1 && r.peaks[0].hz > 219 && r.peaks[0].hz < 221, 'rect: the true mode is strongest but sidelobes are also counted, which is why the Hann count is the evidence count'); }
  const two = synthesize({ modes: [{ hz: 150, amplitude: 1, decay: 2 }, { hz: 240, amplitude: 1, decay: 2 }], seconds: 8 });
  assert.equal(estimate(two.samples, two.sampleRate, 4, { window: 'hann' }).supported, 2, 'a two-mode note gives exactly two supported estimates, insufficient for three');
  const four = synthesize({ modes: [120, 160, 230, 310].map(hz => ({ hz, amplitude: 1, decay: 2 })), seconds: 8 });
  assert.equal(estimate(four.samples, four.sampleRate, 4, { window: 'hann' }).supported, 4, 'a four-mode note reports four, never trimmed to three');
  const noise = synthesize({ modes: [{ hz: 1, amplitude: 1e-9, decay: 1 }], seconds: 8, noiseDb: 0 });
  assert.equal(estimate(noise.samples, noise.sampleRate, 4, { window: 'hann' }).supported, 0, 'noise gives no supported estimate under the 20 dB floor');
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
