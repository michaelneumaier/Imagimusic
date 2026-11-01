import test from 'node:test';
import assert from 'node:assert/strict';
import { answerPeak, stillnessBound, meeting, DEFAULT_STILL_FRACTION } from '../src/score/call-answer.js';
import { LOOM_JOURNEY_SETTINGS } from '../src/score/loom-journey.js';
import { createLoomPerformance, loomPerformanceFrame } from '../src/loom/performance.js';

const S = LOOM_JOURNEY_SETTINGS;

test('answerPeak: the unstruck body swells, measured from the drawn envelope; settings ordered by measurement', () => {
  const out = {};
  for (const [name, settings] of Object.entries(S)) {
    const a = answerPeak(settings, 0);
    assert.ok(a.swellSeconds > 0 && a.swellLevel > 0 && a.ownPeakSeconds !== null, `${name}: a swell exists`);
    // the swell is a real local maximum of the drawn envelope on the stated grid
    const passage = createLoomPerformance(settings, [{ time: 0, body: 0, velocity: 1 }]), env = t => loomPerformanceFrame(passage, t).envelope[1];
    assert.ok(env(a.swellSeconds) >= env(a.swellSeconds - a.gridSeconds) && env(a.swellSeconds) >= env(a.swellSeconds + a.gridSeconds));
    assert.ok(Math.abs(env(a.swellSeconds) - a.swellLevel) < 1e-12);
    out[name] = a;
    assert.deepEqual(answerPeak(settings, 1).swellSeconds, a.swellSeconds, 'identical bodies in each setting: striking body 1 mirrors body 0');
  }
  assert.ok(out['tight-weave'].swellSeconds < out['close-kin'].swellSeconds, `tight weave swells sooner (${out['tight-weave'].swellSeconds} vs ${out['close-kin'].swellSeconds})`);
  assert.ok(out['distant-cousins'].ratio < out['close-kin'].ratio * 0.5, `the detuned pair's swell is much smaller (${out['distant-cousins'].ratio.toFixed(3)} vs ${out['close-kin'].ratio.toFixed(3)})`);
  console.log('call-answer swells (measured):', JSON.stringify(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { swellSeconds: v.swellSeconds, ratio: +v.ratio.toFixed(4), ownPeakSeconds: v.ownPeakSeconds }]))));
  assert.throws(() => answerPeak(S['close-kin'], 2), /body/);
});

test('stillnessBound is a true upper bound on both drawn envelopes, monotone after the last strike, and stillAt is consistent', () => {
  for (const settings of Object.values(S)) {
    const strikes = [{ time: 0, body: 0, velocity: 0.8 }, { time: 0.9, body: 1, velocity: 0.5 }, { time: 1.3, body: 0, velocity: 1 }];
    const passage = createLoomPerformance(settings, strikes);
    for (let t = 0; t < 6; t += 0.037) {
      const { bound } = stillnessBound(settings, strikes, t), env = loomPerformanceFrame(passage, t).envelope;
      assert.ok(bound >= Math.max(...env) - 1e-12, `bound ${bound} ≥ envelope ${Math.max(...env)} at ${t}`);
    }
    let previous = Infinity;
    for (let t = 1.3; t < 20; t += 0.25) { const { bound } = stillnessBound(settings, strikes, t); assert.ok(bound <= previous + 1e-15); previous = bound; }
    const s = stillnessBound(settings, strikes, 2);
    assert.ok(s.stillAt > 2 && s.threshold === DEFAULT_STILL_FRACTION * s.referenceLevel);
    assert.ok(stillnessBound(settings, strikes, s.stillAt).bound < s.threshold && stillnessBound(settings, strikes, s.stillAt - 0.05).bound >= s.threshold, 'stillAt is the first crossing after now');
    assert.equal(stillnessBound(settings, strikes, s.stillAt + 1).stillAt, s.stillAt + 1, 'already still: stillAt is now');
    assert.ok(/not energy/.test(s.metric));
  }
  assert.equal(stillnessBound(S['close-kin'], [], 3).stillAt, 3);
  assert.throws(() => stillnessBound(S['close-kin'], [{ time: 0, body: 0, velocity: 2 }], 0), /velocity/);
  assert.throws(() => stillnessBound(S['close-kin'], [], 0, { fraction: 1 }), /fraction/);
});

test('meeting classifies a new strike by its own body\'s drawn envelope, agreeing with the metric; both growth and softening occur', () => {
  const settings = S['close-kin'], base = [{ time: 0, body: 0, velocity: 0.7 }];
  const first = meeting(settings, [], { time: 0, body: 0, velocity: 0.7 });
  assert.equal(first.relation, 'first'); assert.equal(first.ratio, null);
  const seen = new Set(), passage = createLoomPerformance(settings, base);
  for (let t = 0.05; t < 2.5; t += 0.011) {
    const m = meeting(settings, base, { time: t, body: 0, velocity: 0.7 });
    const before = loomPerformanceFrame(passage, t - 1e-6).envelope[0];
    assert.ok(Math.abs(m.before - before) < 1e-12);
    const expected = m.ratio > 1.05 ? 'grows' : m.ratio < 0.95 ? 'softens' : 'unchanged';
    assert.equal(m.relation, expected, `classification agrees with the measured ratio at ${t.toFixed(3)}`);
    seen.add(m.relation);
  }
  assert.ok(seen.has('grows') && seen.has('softens'), `within the first 2.5 s a second strike can both grow and soften the struck body's envelope (${[...seen]})`);
  const m = meeting(settings, base, { time: 1, body: 1, velocity: 0.7 });
  assert.equal(m.body, 1); assert.ok(/not energy, not the other body/.test(m.metric));
  assert.throws(() => meeting(settings, [{ time: 2, body: 0, velocity: 0.5 }], { time: 1, body: 0, velocity: 0.5 }), /must not precede/);
});
