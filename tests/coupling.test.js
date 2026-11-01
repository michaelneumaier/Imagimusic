import test from 'node:test';
import assert from 'node:assert/strict';
import { coupledPair, strikeResponse, pickupModes, peakDisplacement, superposeStrikes } from '../src/coupling.js';

test('repeated strikes superpose coherently: sums of shifted responses, energy from the summed state, seek-safe', () => {
  const sys = coupledPair({ f1: 220, f2: 231, kc: 1.5e4, gamma: 1.5 });
  const a = strikeResponse(sys, [1, 0]), b = strikeResponse(sys, [0, 0.6]);
  const both = superposeStrikes(sys, [{ t: 0.1, impulse: [1, 0] }, { t: 0.35, impulse: [0, 0.6] }]);
  assert.deepEqual(both.x(0.05), [0, 0]);                                              // nothing has happened yet
  for (const t of [0.2, 0.34]) { const xs = both.x(t), xa = a.x(t - 0.1); close(xs[0], xa[0]); close(xs[1], xa[1]); }
  for (const t of [0.4, 1.2]) {
    const xs = both.x(t), xa = a.x(t - 0.1), xb = b.x(t - 0.35);
    close(xs[0], xa[0] + xb[0]); close(xs[1], xa[1] + xb[1]);
    const vs = both.v(t), va = a.v(t - 0.1), vb = b.v(t - 0.35); close(vs[0], va[0] + vb[0]); close(vs[1], va[1] + vb[1]);
  }
  // Energy is not additive across strikes: a second identical strike half a period later nearly cancels.
  const lossless = coupledPair({ f1: 200, f2: 200, kc: 0, gamma: 0 }), period = 1 / 200;
  const inPhase = superposeStrikes(lossless, [{ t: 0, impulse: [1, 0] }, { t: period, impulse: [1, 0] }]);
  const antiPhase = superposeStrikes(lossless, [{ t: 0, impulse: [1, 0] }, { t: period / 2, impulse: [1, 0] }]);
  const single = strikeResponse(lossless, [1, 0]).energy0;
  close(inPhase.energy(3 * period), 4 * single, 1e-6); assert.ok(antiPhase.energy(3 * period) < 1e-6 * single);
  // Seek safety and per-strike modes for additive synthesis.
  const times = [0.9, 0.12, 0.5]; const out = times.map(t => both.x(t)); times.forEach((t, i) => assert.deepEqual(both.x(t), out[i]));
  assert.deepEqual(both.strikes, [0.1, 0.35]); assert.equal(both.modes(1).length, 2); assert.equal(both.modes(1)[1].onset, 0.35);
  assert.throws(() => superposeStrikes(sys, 'x'), /array/); assert.throws(() => superposeStrikes(sys, [{ t: NaN, impulse: [1, 0] }]), /t/);
});

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps * Math.max(1, Math.abs(b)), `${a} vs ${b}`);

test('zero coupling is exact: the unstruck body stays at rest and the struck one is a plain damped oscillator', () => {
  const sys = coupledPair({ f1: 220, f2: 330, kc: 0, gamma: 2 });
  assert.deepEqual(sys.vectors, [[1, 0], [0, 1]]);
  close(sys.normalFreqsHz[0], Math.sqrt((2 * Math.PI * 220) ** 2 - 4) / (2 * Math.PI));
  const r = strikeResponse(sys, [1, 0]);
  for (const t of [0, 0.001, 0.01, 0.1, 0.5]) { assert.equal(Math.abs(r.x(t)[1]), 0); assert.equal(Math.abs(r.v(t)[1]), 0); }   // exactly zero (sign of zero aside)
  const wd = sys.omegaD[0];
  close(r.x(0.01)[0], (1 / wd) * Math.exp(-2 * 0.01) * Math.sin(wd * 0.01));
  assert.deepEqual(r.x(-1), [0, 0]);
});

test('mechanical energy is constant without damping and non-increasing with damping', () => {
  const lossless = strikeResponse(coupledPair({ m1: 1, m2: 2, f1: 200, f2: 210, kc: 3e4, gamma: 0 }), [1, 0.3]);
  for (let k = 0; k <= 200; k++) close(lossless.energy(k * 0.0005), lossless.energy0, 1e-7);
  const damped = strikeResponse(coupledPair({ m1: 1, m2: 2, f1: 200, f2: 210, kc: 3e4, gamma: 3 }), [1, 0.3]);
  let previous = Infinity, decreasing = true;
  for (let k = 0; k <= 400; k++) { const e = damped.energy(k * 0.0005); if (e > previous * (1 + 1e-9)) decreasing = false; previous = e; }
  assert.ok(decreasing); assert.ok(damped.energy(0.5) < damped.energy0 * 0.1);
});

test('swapping identical bodies swaps the response (reciprocity)', () => {
  const sys = coupledPair({ f1: 300, f2: 300, kc: 2e4, gamma: 1 });
  const a = strikeResponse(sys, [1, 0]), b = strikeResponse(sys, [0, 1]);
  for (const t of [0.002, 0.03, 0.2]) { const xa = a.x(t), xb = b.x(t); close(xa[0], xb[1], 1e-9); close(xa[1], xb[0], 1e-9); }
});

test('near-matched bodies exchange energy; detuning limits the transfer; the exchange rate follows the coupling', () => {
  const matched = strikeResponse(coupledPair({ f1: 300, f2: 300, kc: 2e4, gamma: 0 }), [1, 0]);
  const transfer = peakDisplacement(matched, 1, 0.5) / peakDisplacement(matched, 0, 0.5);
  assert.ok(transfer > 0.95, `matched transfer ${transfer}`);                         // full beat exchange
  const detuned = strikeResponse(coupledPair({ f1: 300, f2: 420, kc: 2e4, gamma: 0 }), [1, 0]);
  const weak = peakDisplacement(detuned, 1, 0.5) / peakDisplacement(detuned, 0, 0.5);
  assert.ok(weak < 0.3 && weak > 0, `detuned transfer ${weak}`);
  // Beat (exchange) frequency equals the split between the two normal frequencies.
  const sys = coupledPair({ f1: 300, f2: 300, kc: 2e4, gamma: 0 });
  const split = sys.normalFreqsHz[1] - sys.normalFreqsHz[0];
  assert.ok(split > 0);
  const stronger = coupledPair({ f1: 300, f2: 300, kc: 8e4, gamma: 0 });
  assert.ok(stronger.normalFreqsHz[1] - stronger.normalFreqsHz[0] > split);
  // Energy first fully arrives in body 2 after half a beat period.
  const r = strikeResponse(sys, [1, 0]), halfBeat = 0.5 / split, x1 = Math.abs(r.x(halfBeat)[0]);
  assert.ok(peakDisplacement(r, 0, halfBeat * 0.05) > 10 * x1 || x1 < 1e-3 * peakDisplacement(r, 0, 0.5));
});

test('the response is seek-safe and matches its initial impulse conditions', () => {
  const sys = coupledPair({ m1: 0.5, m2: 1.5, f1: 180, f2: 240, kc: 1e4, gamma: 4 });
  const r = strikeResponse(sys, [0.7, -0.2]);
  close(r.x(0)[0], 0); close(r.x(0)[1], 0);
  close(r.v(0)[0], 0.7 / 0.5); close(r.v(0)[1], -0.2 / 1.5);                     // ẋ(0) = J / m
  const times = [0.3, 0.01, 0.2, 0.05]; const a = times.map(t => r.x(t)), b = [...times].sort().map(t => r.x(t));
  times.forEach((t, i) => assert.deepEqual(a[i], b[[...times].sort().indexOf(t)]));
  // numerical derivative of x agrees with v
  const h = 1e-6, t0 = 0.0731; const dx = r.x(t0 + h).map((xp, i) => (xp - r.x(t0 - h)[i]) / (2 * h));
  close(dx[0], r.v(t0)[0], 1e-5); close(dx[1], r.v(t0)[1], 1e-5);
});

test('pickup modes expose each body as two decaying sines at the normal frequencies with signed coefficients, normalized separately from energy', () => {
  const sys = coupledPair({ f1: 300, f2: 300, kc: 2e4, gamma: 2 });
  const struck = pickupModes(sys, [1, 0], 0), other = pickupModes(sys, [1, 0], 1);
  assert.equal(struck.length, 2); assert.deepEqual(struck.map(m => m.frequency), sys.normalFreqsHz);
  assert.ok(struck.every(m => m.decay === 0.5 && Math.abs(m.amplitude) <= 0.19));
  close(Math.max(...struck.map(m => Math.abs(m.amplitude))), 0.19);
  // Symmetric pair: the unstruck body carries the two normal modes with opposite signs (the beat), the struck one with equal signs.
  assert.ok(other.every(m => Math.abs(m.amplitude) > 0.1)); assert.ok(Math.sign(other[0].amplitude) !== Math.sign(other[1].amplitude)); assert.ok(Math.sign(struck[0].amplitude) === Math.sign(struck[1].amplitude));
  // The signed sum of the pickup sines reproduces the body's displacement up to the shared normalization.
  const r = strikeResponse(sys, [1, 0]), scale = struck[0].amplitude / r.bodyModes(0)[0].amplitude;
  for (const t of [0.003, 0.02, 0.11]) {
    const synth = other.reduce((s, m) => s + m.amplitude * Math.exp(-t / m.decay) * Math.sin(2 * Math.PI * m.frequency * t), 0);
    close(synth, r.x(t)[1] * scale, 1e-9);
  }
  assert.throws(() => pickupModes(sys, [1, 0], 2), /body/); assert.throws(() => pickupModes(sys, [1, 0], 0, { level: -1 }), /level/);
});

test('a tiny coupling between equal frequencies still yields a true eigenbasis, and energy is conserved over long times', () => {
  const sys = coupledPair({ f1: 300, f2: 300, kc: 1e-6, gamma: 0 });
  for (let j = 0; j < 2; j++) {
    const v = sys.vectors[j], Av = [sys.A[0][0] * v[0] + sys.A[0][1] * v[1], sys.A[1][0] * v[0] + sys.A[1][1] * v[1]];
    close(Av[0], sys.lambda[j] * v[0], 1e-12); close(Av[1], sys.lambda[j] * v[1], 1e-12);
    close(Math.hypot(...v), 1, 1e-12);
  }
  close(Math.abs(sys.vectors[0][0]), Math.SQRT1_2, 1e-9);                       // ±45°, not the false diagonal basis
  assert.ok(sys.lambda[1] > sys.lambda[0]);
  const r = strikeResponse(sys, [1, 0]);
  for (const t of [0, 1, 10, 100, 1000]) close(r.energy(t), r.energy0, 1e-6);
  assert.deepEqual(coupledPair({ f1: 300, f2: 300, kc: 0 }).vectors, [[1, 0], [0, 1]]);
});

test('inputs whose derived matrices overflow are rejected with a range error, never NaN', () => {
  assert.throws(() => coupledPair({ f1: 1e200, f2: 100 }), RangeError);
  assert.throws(() => coupledPair({ f1: 100, f2: 100, kc: 1e308, m1: 1e-10 }), RangeError);
  assert.throws(() => coupledPair({ f1: 100, f2: 100, gamma: 1e200 }), RangeError);
  const ok = coupledPair({ f1: 20000, f2: 20, kc: 1e6, m1: 1e-3, m2: 10, gamma: 50 });
  assert.ok(ok.lambda.every(Number.isFinite) && ok.omegaD.every(Number.isFinite));
});

test('validation: bounds, underdamped requirement, and malformed impulses', () => {
  assert.throws(() => coupledPair({ f1: 0, f2: 100 }), /f1/); assert.throws(() => coupledPair({ f1: 100, f2: 100, kc: -1 }), /kc/);
  assert.throws(() => coupledPair({ f1: 1, f2: 1, gamma: 1000 }), /underdamped/);
  assert.throws(() => coupledPair({ f1: 100, f2: 100, m1: 0 }), /m1/);
  const sys = coupledPair({ f1: 100, f2: 120 });
  assert.throws(() => strikeResponse(sys, [1]), /impulse/); assert.throws(() => strikeResponse(sys, [1, NaN]), /impulse/);
  assert.throws(() => strikeResponse(sys, [1, 0]).x(NaN), /t must/);
  assert.equal(coupledPair({ f1: 100, f2: 100, kc: 0, gamma: 0 }).decayS, Infinity);
});
