import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TENSIONER, TENSIONER_BOUNDS, validateTensioner, tensionerCore, tensionerPhase, tensionerInstantaneousHz, tensionerSample,
  tensionerState, tensionerEnd, renderTensioner, besselJ, besselJk, besselSeries, aliasScreening, MAX_DURATION_S,
} from '../src/fm.js';

const close = (a, b, eps) => assert.ok(Math.abs(a - b) <= eps, `${a} vs ${b} (eps ${eps})`);
const core = block => tensionerCore({ ...DEFAULT_TENSIONER, ...block });

// Goertzel-style single-frequency DFT magnitude with a Hann window over samples [start, start+len).
function dftMag(x, sampleRate, freq, start = 0, len = x.length - start) {
  let re = 0, im = 0;
  for (let n = 0; n < len; n++) { const w = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (len - 1)), v = x[start + n] * w, a = 2 * Math.PI * freq * n / sampleRate; re += v * Math.cos(a); im -= v * Math.sin(a); }
  return Math.hypot(re, im);
}

test('Bessel functions: known values, J_{-k} parity, and the sum rule', () => {
  const j = besselJ(2.405, 6);
  close(j[0], 0, 1e-4); close(j[1], 0.5191, 1e-3);
  const j1 = besselJ(1, 8); close(j1[0], 0.7652, 1e-4); close(j1[1], 0.4401, 1e-4); close(j1[2], 0.1149, 1e-4);
  const j10 = besselJ(10, 30); close(j10[0], -0.2459, 1e-4); close(j10[5], -0.2341, 1e-4);
  assert.equal(besselJk(j1, -1), -j1[1]); assert.equal(besselJk(j1, -2), j1[2]);
  let sum = j10[0]; for (let k = 2; k <= 30; k += 2) sum += 2 * j10[k]; close(sum, 1, 1e-12);
  assert.deepEqual(Array.from(besselJ(0, 3)), [1, 0, 0, 0]);
});

test('closed-form FM phase equals the Bessel series in the time domain (folded cases included, phase per Chowning)', () => {
  for (const ratio of [1, 2, 3.5]) for (const I of [0.5, 1, 2.405, 5]) {
    const tn = core({ carrierHz: 220, ratio, index: I, constantIndex: true, phase0: 0.3 });
    const N = Math.ceil(I) + 20;
    for (let i = 0; i < 400; i++) { const t = i * 0.00123; close(Math.sin(tensionerPhase(t, tn)), besselSeries(t, tn, N), 1e-6); }
  }
});

test('non-overlapping magnitudes follow |J_k| and the carrier vanishes at J_0 = 0 (reference case outside UI bounds, core only)', () => {
  // f_c = 4000 Hz, f_m = 100 Hz is outside validateTensioner's bounds on purpose (no folding for I ≤ 5 at 48 kHz).
  for (const I of [1, 2.405]) {
    const tn = core({ carrierHz: 4000, ratio: 0.025, index: I, constantIndex: true, ampDecayS: 8, level: 0.5 });
    const sr = 48000, len = 65536, x = new Float32Array(len);
    for (let n = 0; n < len; n++) x[n] = 0.5 * Math.sin(tensionerPhase(n / sr, tn));          // steady, no envelope
    const j = besselJ(I, 6), mags = [0, 1, 2, 3, 4].map(k => dftMag(x, sr, 4000 + k * 100, 0, len));
    const ref = mags[1] / Math.abs(j[1]);
    for (let k = 0; k <= 4; k++) if (Math.abs(j[k]) > 0.02) close(mags[k] / ref, Math.abs(j[k]), 0.02 * Math.abs(j[k]) + 1e-9);
    if (I === 2.405) { const strongest = Math.max(...mags.slice(1)); assert.ok(20 * Math.log10(mags[0] / strongest) < -40, 'carrier null at J0 zero'); }
  }
});

test('ratio 3.5 produces the predicted inharmonic set at Bessel-predicted levels (presence only)', () => {
  const tn = core({ carrierHz: 220, ratio: 3.5, index: 1.5, constantIndex: true }), sr = 48000, len = 65536, x = new Float32Array(len);
  for (let n = 0; n < len; n++) x[n] = Math.sin(tensionerPhase(n / sr, tn));
  const j = besselJ(1.5, 4), fm = 770;
  const at = f => dftMag(x, sr, f, 0, len), carrier = at(220);
  close(at(220 + fm) / carrier, Math.abs(j[1] / j[0]), 0.05);        // 4.5 f_c
  close(at(Math.abs(220 - fm)) / carrier, Math.abs(j[1] / j[0]), 0.05); // 2.5 f_c, reflected k = −1
  close(at(220 + 2 * fm) / carrier, Math.abs(j[2] / j[0]), 0.05);    // 8 f_c
});

test('decaying index: a pure carrier late, strong sidebands early; index, deviation and tension follow the envelope', () => {
  const tn = core({ carrierHz: 220, ratio: 1, index: 5, indexDecayS: 0.3, ampDecayS: 8 }), sr = 48000;
  const x = renderTensioner(tn, sr), fm = 220;
  const late = f => dftMag(x, sr, f, Math.round(2 * sr), Math.round(0.4 * sr));
  const strongestLate = Math.max(late(220 + fm), late(220 + 2 * fm), late(220 + 3 * fm));
  assert.ok(20 * Math.log10(strongestLate / late(220)) < -40, 'late spectrum is a pure carrier');
  const early = f => dftMag(x, sr, f, Math.round(0.05 * sr), Math.round(0.08 * sr));
  const strongestEarly = Math.max(early(220 + fm), early(220 + 2 * fm), early(220 + 3 * fm), early(220 + 4 * fm));
  assert.ok(20 * Math.log10(strongestEarly / early(220)) > -12, 'early sidebands are strong');
  const s0 = tensionerState(0, tn), s1 = tensionerState(0.3, tn);
  close(s0.index, 5, 1e-12); close(s1.index, 5 * Math.exp(-1), 1e-12); close(s1.tension01, Math.exp(-1), 1e-12);
  close(s1.deviationHz, s1.index * 220, 1e-9); assert.equal(s0.positiveInstantaneousFrequency, false);
  assert.equal(tensionerState(1, core({ index: 0 })).tension01, 0);
  assert.equal('modulatorPhase01' in tensionerState(1, tn), false);
  assert.ok('modulatorPhase01' in tensionerState(1, core({ carrierHz: 20, ratio: 0.25 })));   // 5 Hz: below the 8 Hz display threshold (outside UI bounds)
});

test('phase is the exact integral of the instantaneous frequency, including where it is negative', () => {
  const tn = core({ carrierHz: 220, ratio: 2, index: 3, indexDecayS: 0.8 });
  const h = 1e-6, T = 0.5, steps = Math.round(T / h);
  let simpson = 0;
  for (let i = 0; i < steps; i += 2) {
    const t0 = i * h, t1 = t0 + h, t2 = t0 + 2 * h;
    simpson += (h / 3) * (tensionerInstantaneousHz(t0, tn) + 4 * tensionerInstantaneousHz(t1, tn) + tensionerInstantaneousHz(t2, tn));
  }
  close(tensionerPhase(T, tn) - tn.phase0, 2 * Math.PI * simpson, 1e-6);
  let sawNegative = false;
  for (const t of [0.0011, 0.0203, 0.1, 0.25, 0.4]) {
    const d = (tensionerPhase(t + 1e-7, tn) - tensionerPhase(t - 1e-7, tn)) / 2e-7, f = tensionerInstantaneousHz(t, tn);
    close(d, 2 * Math.PI * f, 1e-6 * Math.max(1, Math.abs(2 * Math.PI * f))); if (f < 0) sawNegative = true;
  }
  assert.ok(sawNegative, 'the default note swings through negative instantaneous frequency');
  const steady = core({ index: 2, constantIndex: true });
  close(tensionerPhase(0.01, steady), 2 * Math.PI * 220 * 0.01 + 2 * (1 - Math.cos(2 * Math.PI * 440 * 0.01)), 1e-12);
});

test('alias screening is a heuristic that rejects obvious cases and accepts the default; its result is reported', () => {
  assert.throws(() => validateTensioner({ ...DEFAULT_TENSIONER, carrierHz: 2000, ratio: 8, index: 10 }), /alias screening rejects/);
  const ok = validateTensioner(DEFAULT_TENSIONER);
  assert.equal(ok.derived.aliasScreening.accepted, true); assert.equal(ok.derived.aliasScreening.heuristic, true);
  assert.ok(ok.derived.aliasScreening.tailEnergyRatio < 1e-6);
  const s = aliasScreening(core({ carrierHz: 2000, ratio: 8, index: 10 }), 48000);
  assert.equal(s.accepted, false); assert.ok(s.tailEnergyRatio > 1e-3);
});

test('measured convergence: 48 kHz render vs decimated 192 kHz render agree below 20 kHz at a representative extreme (residual reported)', () => {
  // Representative allowed extreme: highest carrier the screening admits at ratio 2 / index 3 (the default voice shape).
  const tn = core({ carrierHz: 1200, ratio: 2, index: 3, indexDecayS: 0.8, ampDecayS: 0.6 });
  assert.equal(aliasScreening(tn, 48000).accepted, true);
  const lo = renderTensioner(tn, 48000), hi = renderTensioner(tn, 192000);
  // Windowed-sinc lowpass at 20 kHz on the 192 kHz render, then take every 4th sample.
  const taps = 255, fcN = 20000 / 192000, h = new Float64Array(taps), mid = (taps - 1) / 2; let hs = 0;
  for (let i = 0; i < taps; i++) { const n = i - mid, sinc = n === 0 ? 2 * fcN : Math.sin(2 * Math.PI * fcN * n) / (Math.PI * n); const w = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (taps - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (taps - 1)); h[i] = sinc * w; hs += h[i]; }
  for (let i = 0; i < taps; i++) h[i] /= hs;
  const dec = new Float32Array(lo.length);
  for (let m = 0; m < dec.length; m++) { const center = 4 * m; let acc = 0; for (let i = 0; i < taps; i++) { const k = center + i - mid; if (k >= 0 && k < hi.length) acc += h[i] * hi[k]; } dec[m] = acc; }
  const start = Math.round(0.05 * 48000), len = Math.round(0.4 * 48000);
  const freqs = []; for (let k = -6; k <= 6; k++) { const f = Math.abs(1200 + k * 2400); if (f > 0 && f < 20000) freqs.push(f); }
  let worstDb = -Infinity, peak = 0;
  const magsLo = freqs.map(f => dftMag(lo, 48000, f, start, len)), magsHi = freqs.map(f => dftMag(dec, 48000, f, start, len));
  peak = Math.max(...magsLo);
  freqs.forEach((f, i) => { const residual = Math.abs(magsLo[i] - magsHi[i]) / peak; worstDb = Math.max(worstDb, 20 * Math.log10(residual + 1e-30)); });
  console.log(`fm convergence residual (48 kHz vs decimated 192 kHz, worst over predicted components): ${worstDb.toFixed(1)} dB re peak`);
  assert.ok(worstDb < -50, `residual ${worstDb.toFixed(1)} dB exceeds the −50 dB target`);
});

test('fade and finite end: sample-aligned end, last sample exactly zero, Float32 render equals fround(sample)', () => {
  const tn = core({ ampDecayS: 0.3 }), sr = 48000, { samples, endS } = tensionerEnd(tn, sr);
  const x = renderTensioner(tn, sr);
  assert.equal(x.length, samples); assert.equal(x[x.length - 1], 0); assert.equal(endS, (samples - 1) / sr);
  assert.ok(samples / sr <= MAX_DURATION_S + 1 / sr);
  for (const n of [0, 1, 1000, samples - 1200, samples - 2, samples - 1]) assert.equal(x[n], Math.fround(tensionerSample(n / sr, tn, endS)));
  assert.ok(Math.abs(x[samples - 1200]) < 1e-3 && x.some(v => Math.abs(v) > 0.05));
  const long = tensionerEnd(core({ ampDecayS: 8 }), sr); close(long.samples / sr, MAX_DURATION_S, 1 / sr);
  assert.equal(tensionerSample(-1, tn, endS), 0); assert.equal(tensionerSample(endS + 1, tn, endS), 0);
});

test('slow vibrato is reachable within bounds (ratio 0.01) with a sub-8 Hz wheel, and index 0 has zero bandwidth estimate', () => {
  const v = validateTensioner({ ...DEFAULT_TENSIONER, ratio: 0.01, index: 3, constantIndex: true });   // f_m = 2.2 Hz, D = 6.6 Hz: vibrato
  close(v.derived.modulatorHz, 2.2, 1e-12); assert.equal(v.derived.positiveInstantaneousFrequency, true);
  const tn = tensionerCore(v), s = tensionerState(0.25, tn);
  assert.ok('modulatorPhase01' in s); close(s.modulatorPhase01, 0.55, 1e-12);
  // Phase integral still exact at a slow modulator (no small-ω_m hazard).
  close(tensionerPhase(1, tn), 2 * Math.PI * 220 + 3 * (1 - Math.cos(2 * Math.PI * 2.2)), 1e-9);
  const decaying = tensionerCore(validateTensioner({ ...DEFAULT_TENSIONER, ratio: 0.01 }));
  const h = 1e-6; let simpson = 0; for (let i = 0; i < 200000; i += 2) { const t0 = i * h; simpson += (h / 3) * (tensionerInstantaneousHz(t0, decaying) + 4 * tensionerInstantaneousHz(t0 + h, decaying) + tensionerInstantaneousHz(t0 + 2 * h, decaying)); }
  close(tensionerPhase(0.2, decaying) - decaying.phase0, 2 * Math.PI * simpson, 1e-6);
  assert.throws(() => validateTensioner({ ...DEFAULT_TENSIONER, ratio: 0.005 }), /ratio/);
  const pure = tensionerCore(validateTensioner({ ...DEFAULT_TENSIONER, index: 0 }));
  assert.equal(tensionerState(0.5, pure).bandwidthEstimateHz, 0); assert.equal(tensionerState(0.5, pure).tension01, 0);
  assert.ok(tensionerState(0.5, tn).bandwidthEstimateHz > 0);
});

test('determinism, seeks, serialization round trip, and bounds', () => {
  const v = validateTensioner(DEFAULT_TENSIONER);
  assert.deepEqual(validateTensioner(JSON.parse(JSON.stringify(v))), v);                   // no Infinity anywhere in the saved form
  const c = validateTensioner({ ...DEFAULT_TENSIONER, constantIndex: true });
  assert.equal(tensionerCore(c).tauI, Infinity); assert.equal(JSON.parse(JSON.stringify(c)).constantIndex, true);
  const tn = core({}), a = renderTensioner(tn, 8000), b = renderTensioner(tn, 8000); assert.deepEqual(a, b);
  const times = [0.3, 0.01, 0.2, 0.05]; const out = times.map(t => tensionerSample(t, tn, 5)); times.forEach((t, i) => assert.equal(tensionerSample(t, tn, 5), out[i]));
  for (const bad of [{ carrierHz: 10 }, { ratio: 9 }, { index: 11 }, { indexDecayS: 0.001 }, { ampDecayS: 9 }, { level: 2 }, { carrierHz: NaN }])
    assert.throws(() => validateTensioner({ ...DEFAULT_TENSIONER, ...bad }));
  assert.throws(() => validateTensioner(null)); assert.throws(() => besselSeries(0, core({}), 5), /constant/);
  assert.equal(TENSIONER_BOUNDS.index[1], 10); assert.throws(() => tensionerEnd(tn, 0));
});
