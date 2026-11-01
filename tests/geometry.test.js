import test from 'node:test';
import assert from 'node:assert/strict';
import { modesOf, toModelModes, GEOMETRY_MATERIALS, BETA_L_CLAMPED_FREE, MAX_MODES } from '../src/geometry.js';

const steelTine = { kind: 'beam', lengthM: 0.05, thicknessM: 0.001, widthM: 0.01, material: GEOMETRY_MATERIALS.steel, support: 'clamped-free' };
const guitarA = { kind: 'string', lengthM: 0.65, tensionN: 70, linearDensity: 0.0038 };
const close = (a, b, rel = 1e-3) => assert.ok(Math.abs(a - b) <= rel * Math.abs(b), `${a} vs ${b}`);

test('cantilever partials follow the (β_n L)² ratios from the textbook roots', () => {
  const { freqsHz } = modesOf(steelTine);
  const expected = BETA_L_CLAMPED_FREE.map(bl => (bl / BETA_L_CLAMPED_FREE[0]) ** 2); // 1, 6.267, 17.55, 34.39, 56.84
  freqsHz.forEach((f, i) => close(f / freqsHz[0], expected[i], 1e-4));
  close(freqsHz[1] / freqsHz[0], 6.267, 1e-3);
});

test('a 50 mm x 1 mm steel tine rings in the low-to-mid hundreds of hertz', () => {
  const { freqsHz } = modesOf(steelTine);
  assert.ok(freqsHz[0] > 250 && freqsHz[0] < 450, `f1 = ${freqsHz[0]}`);
});

test('beam frequency scales as thickness / length², and width does not matter', () => {
  const base = modesOf(steelTine).freqsHz[0];
  close(modesOf({ ...steelTine, lengthM: 0.025 }).freqsHz[0], base * 4);
  close(modesOf({ ...steelTine, thicknessM: 0.002 }).freqsHz[0], base * 2);
  close(modesOf({ ...steelTine, widthM: 0.03 }).freqsHz[0], base);
  close(modesOf({ ...steelTine, material: { ...GEOMETRY_MATERIALS.steel, E: 4 * GEOMETRY_MATERIALS.steel.E } }).freqsHz[0], base * 2);
});

test('cantilever shapes are clamped at the root, free at the tip, normalized, and have n-1 interior nodes', () => {
  const { shapes } = modesOf(steelTine, { count: 5 });
  shapes.forEach((shape, n) => {
    assert.ok(Math.abs(shape(0)) < 1e-9, 'zero displacement at the clamp');
    assert.ok(Math.abs(shape(1e-4)) < 1e-6, 'zero slope at the clamp');
    let peak = 0, crossings = 0, previous = shape(0.002);
    for (let i = 2; i <= 1000; i++) {
      const value = shape(i / 1000);
      peak = Math.max(peak, Math.abs(value));
      if (i > 2 && Math.sign(value) !== Math.sign(previous) && Math.abs(value) > 1e-12 && i < 1000) crossings++;
      previous = value;
    }
    close(peak, 1, 1e-6);
    assert.equal(crossings, n, `mode ${n + 1} should have ${n} interior nodes`);
  });
  assert.ok(Math.abs(shapes[0](1)) > 0.999, 'first mode peaks at the free tip');
});

test('strike position changes modal weights: a node is silent for that mode, the tip excites everything', () => {
  const set = modesOf(steelTine, { count: 3 });
  const tip = set.weightsAt(1);
  assert.ok(tip.every(w => Math.abs(w) > 0.5));
  // Second mode node sits near x ≈ 0.783 L for a cantilever.
  let nodeX = 0.7, best = 1;
  for (let x = 0.7; x <= 0.9; x += 0.0005) { const v = Math.abs(set.shapes[1](x)); if (v < best) { best = v; nodeX = x; } }
  assert.ok(Math.abs(nodeX - 0.783) < 0.01, `node at ${nodeX}`);
  assert.ok(Math.abs(set.weightsAt(nodeX)[1]) < 0.01);
  assert.ok(Math.abs(set.weightsAt(nodeX)[0]) > 0.3);
});

test('ideal string is harmonic, stiffness stretches the partials, and the pitch formula holds', () => {
  const ideal = modesOf(guitarA);
  close(ideal.freqsHz[0], Math.sqrt(70 / 0.0038) / 1.3);          // ≈ 104.4 Hz
  ideal.freqsHz.forEach((f, i) => close(f / ideal.freqsHz[0], i + 1, 1e-9));
  const stiff = modesOf({ ...guitarA, stiffness: 2e-4 });
  stiff.freqsHz.forEach((f, i) => { if (i) assert.ok(f / stiff.freqsHz[0] > i + 1); });
  assert.ok(stiff.freqsHz[4] / stiff.freqsHz[0] > ideal.freqsHz[4] / ideal.freqsHz[0]);
  assert.ok(stiff.meta.assumptions.some(a => a.includes('inharmonicity')));
});

test('string shapes vanish at both ends and are sine modes', () => {
  const { shapes } = modesOf(guitarA, { count: 4 });
  shapes.forEach((shape, i) => {
    assert.ok(Math.abs(shape(0)) < 1e-12 && Math.abs(shape(1)) < 1e-9);
    close(shape(0.5 / (i + 1)), 1, 1e-9);
  });
});

test('decays are positive, finite, and shorter for higher modes under a constant loss factor', () => {
  for (const g of [steelTine, guitarA]) {
    const { decaysS, freqsHz } = modesOf(g);
    decaysS.forEach((d, i) => { assert.ok(Number.isFinite(d) && d > 0); if (i) assert.ok(d < decaysS[i - 1]); close(d, 1 / (Math.PI * freqsHz[i] * (g.material?.eta ?? 1e-3))); });
  }
  const lossy = modesOf({ ...steelTine, material: { ...GEOMETRY_MATERIALS.steel, eta: 2e-3 } });
  assert.ok(lossy.decaysS[0] < modesOf(steelTine).decaysS[0]);
});

test('Nyquist guard drops modes at or above 0.45 × sampleRate and reports how many', () => {
  const set = modesOf(steelTine, { count: 6, sampleRate: 8000 });
  assert.ok(set.freqsHz.every(f => f < 3600));
  assert.equal(set.freqsHz.length + set.dropped, 6);
  assert.ok(set.dropped >= 1);
  assert.equal(set.shapes.length, set.freqsHz.length);
  assert.equal(set.weightsAt(1).length, set.freqsHz.length);
});

test('validation rejects unimplemented supports, unknown kinds, bad dimensions, and bad counts', () => {
  assert.throws(() => modesOf({ ...steelTine, support: 'free-free' }), /not implemented/);
  assert.throws(() => modesOf({ kind: 'plate' }), /not implemented/);
  assert.throws(() => modesOf({ ...steelTine, lengthM: 0 }), /lengthM/);
  assert.throws(() => modesOf({ ...steelTine, thicknessM: NaN }), /thicknessM/);
  assert.throws(() => modesOf({ ...steelTine, material: { E: 1e9, rho: -1, eta: 1e-3 } }), /rho/);
  assert.throws(() => modesOf({ ...guitarA, stiffness: -1 }), /stiffness/);
  assert.throws(() => modesOf(steelTine, { count: 0 }), /count/);
  assert.throws(() => modesOf(steelTine, { count: MAX_MODES + 1 }), /count/);
  assert.throws(() => modesOf(steelTine, { count: 2.5 }), /count/);
  assert.throws(() => modesOf(null), /object/);
});

test('toModelModes produces the garden shape (frequency, amplitude, decay) with weights from the strike point', () => {
  const set = modesOf(steelTine, { count: 3 });
  const modes = toModelModes(set, { strikeX01: 1 });
  assert.equal(modes.length, 3);
  modes.forEach((m, i) => { assert.equal(m.frequency, set.freqsHz[i]); assert.equal(m.decay, set.decaysS[i]); assert.ok(m.amplitude > 0 && m.amplitude <= 0.19); });
  const atNode = toModelModes(set, { strikeX01: 0.783 });
  assert.ok(atNode[1].amplitude < 0.01 * modes[1].amplitude);
});
