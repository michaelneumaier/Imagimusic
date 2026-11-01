import test from 'node:test';
import assert from 'node:assert/strict';
import { coupledPair, strikeResponse, coupledNetwork, networkStrikeResponse, networkPickupScale, networkPickupModes, symmetricEigen } from '../src/coupling.js';

// Deterministic pseudo-random systems (no Math.random): a small LCG so the suite is reproducible.
const lcg = seed => () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const randomSystem = (seed, n) => { const r = lcg(seed); const masses = Array.from({ length: n }, () => 0.01 + 0.03 * r()), frequencies = Array.from({ length: n }, () => 150 + 100 * r()); const edges = []; for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) if (r() < 0.7) edges.push({ a, b, kc: 0.004 * masses[a] * (2 * Math.PI * frequencies[a]) ** 2 * (0.2 + r()) }); return coupledNetwork({ masses, frequencies, edges, gamma: 0.3 + r() }); };
const relErr = (a, b, scale) => Math.abs(a - b) / scale;

test('symmetricEigen: residual relative to the matrix norm and orthogonality within 1e-12 for random symmetric matrices', () => {
  const r = lcg(7);
  for (let n = 2; n <= 8; n++) for (let trial = 0; trial < 5; trial++) {
    const m = Array.from({ length: n }, () => Array.from({ length: n }, () => r() - 0.5)); for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) m[i][j] = m[j][i];
    const { lambda, residual, orthogonality } = symmetricEigen(m);
    assert.ok(residual < 1e-12 && orthogonality < 1e-12, `n=${n}: residual ${residual}, orthogonality ${orthogonality}`);
    for (let j = 1; j < n; j++) assert.ok(lambda[j] >= lambda[j - 1]);
  }
  const diag = symmetricEigen([[3, 0], [0, 1]]); assert.deepEqual(diag.lambda, [1, 3]);
});

test('N = 2 reproduces coupledPair: displacement and velocity at sampled times to 1e-12 relative, equal and unequal masses, with and without coupling', () => {
  for (const [m1, m2, f1, f2, kc, gamma] of [[0.02, 0.02, 196, 196, 0.004 * 0.02 * (2 * Math.PI * 196) ** 2, 0.45], [0.02, 0.05, 196, 220, 0.004 * 0.02 * (2 * Math.PI * 196) ** 2, 0.7], [0.03, 0.01, 150, 300, 0, 0.3]]) {
    const pair = coupledPair({ m1, m2, f1, f2, kc, gamma }), net = coupledNetwork({ masses: [m1, m2], frequencies: [f1, f2], edges: kc ? [{ a: 0, b: 1, kc }] : [], gamma });
    assert.ok(pair.normalFreqsHz.every((f, j) => relErr(f, net.normalFreqsHz[j], f) < 1e-12));
    for (const J of [[0.01, 0], [0, 0.01], [0.007, -0.003]]) {
      const a = strikeResponse(pair, J), b = networkStrikeResponse(net, J);
      let scale = 0; for (let t = 0; t <= 2; t += 0.011) scale = Math.max(scale, ...a.x(t).map(Math.abs));
      for (let t = 0; t <= 2; t += 0.011) {
        const xa = a.x(t), xb = b.x(t), va = a.v(t), vb = b.v(t);
        for (let i = 0; i < 2; i++) { assert.ok(relErr(xa[i], xb[i], scale) < 1e-12, `x at ${t}`); assert.ok(relErr(va[i], vb[i], scale * 2 * Math.PI * 300) < 1e-12, `v at ${t}`); }
      }
    }
  }
});

test('the closed form satisfies the equations of motion and the initial conditions for N = 3..6, including repeated eigenvalues', () => {
  const systems = [randomSystem(11, 3), randomSystem(12, 4), randomSystem(13, 5), randomSystem(14, 6),
    // isotropic triangle: three identical bodies fully connected → a repeated eigenvalue
    coupledNetwork({ masses: [0.02, 0.02, 0.02], frequencies: [196, 196, 196], edges: [{ a: 0, b: 1, kc: 50 }, { a: 1, b: 2, kc: 50 }, { a: 0, b: 2, kc: 50 }], gamma: 0.4 })];
  for (const sys of systems) {
    assert.ok(sys.eigen.residual < 1e-12 && sys.eigen.orthogonality < 1e-12);
    const J = sys.m.map((_, i) => (i === 0 ? 0.01 : 0)), r = networkStrikeResponse(sys, J), h = 1e-6;
    assert.ok(r.x(0).every(x => x === 0), 'at rest at t = 0'); assert.ok(r.v(0).every((v, i) => relErr(v, J[i] / sys.m[i], 0.01 / sys.m[i] + 1e-300) < 1e-9), 'v(0) = J / m');
    let scale = 0; for (let t = 0; t <= 1; t += 0.05) scale = Math.max(scale, ...r.x(t).map(Math.abs));
    for (let t = 0.05; t <= 1; t += 0.137) {
      const x = r.x(t), v = r.v(t), xp = r.x(t + h), xm = r.x(t - h);
      for (let i = 0; i < sys.n; i++) {
        const acc = (xp[i] - 2 * x[i] + xm[i]) / (h * h);
        let kx = 0; for (let k = 0; k < sys.n; k++) kx += sys.K[i][k] * x[k];
        const residual = sys.m[i] * acc + 2 * sys.gamma * sys.m[i] * v[i] + kx, scaleForce = sys.m[i] * (2 * Math.PI * 400) ** 2 * scale;
        assert.ok(Math.abs(residual) / scaleForce < 1e-5, `EOM residual ${residual / scaleForce} at body ${i}, t ${t}`);
      }
    }
    // participation sums to one over bodies for every mode
    for (const p of r.participation) assert.ok(Math.abs(p.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  }
  const iso = systems.at(-1);
  assert.ok(Math.abs(iso.lambda[1] - iso.lambda[2]) < 1e-9 * iso.lambda[2], 'repeated eigenvalue present');
  const r = networkStrikeResponse(iso, [0.01, 0, 0]);
  for (let t = 0; t <= 1; t += 0.1) { const x = r.x(t); assert.ok(Math.abs(x[1] - x[2]) < 1e-12 * (Math.abs(x[0]) + 1e-300), 'symmetry: the two unstruck bodies move identically'); }
});

test('disconnected bodies move only when struck; validation rejects malformed networks', () => {
  const sys = coupledNetwork({ masses: [0.02, 0.03, 0.01], frequencies: [196, 220, 260], edges: [], gamma: 0.4 });
  const r = networkStrikeResponse(sys, [0.01, 0, 0]);
  for (let t = 0; t <= 1; t += 0.1) { const x = r.x(t); assert.equal(x[1], 0); assert.equal(x[2], 0); }
  assert.ok(sys.normalFreqsHz.every((f, j) => relErr(f, Math.sqrt((2 * Math.PI * [196, 220, 260][j]) ** 2 - 0.16) / (2 * Math.PI), f) < 1e-12));
  const bad = (cfg, re) => assert.throws(() => coupledNetwork(cfg), re);
  bad({ masses: [1], frequencies: [100] }, /2\.\.8 bodies/);
  bad({ masses: [1, 1], frequencies: [100] }, /same length/);
  bad({ masses: [1, 1], frequencies: [100, 100], edges: [{ a: 0, b: 0, kc: 1 }] }, /itself/);
  bad({ masses: [1, 1], frequencies: [100, 100], edges: [{ a: 0, b: 1, kc: 1 }, { a: 1, b: 0, kc: 1 }] }, /duplicate/);
  bad({ masses: [1, 1], frequencies: [100, 100], edges: [{ a: 0, b: 2, kc: 1 }] }, /body indices/);
  bad({ masses: [1, 1], frequencies: [100, 100], edges: [{ a: 0, b: 1, kc: -1 }] }, /non-negative/);
  bad({ masses: [1, 1], frequencies: [1, 1], gamma: 100 }, /not underdamped/);
  assert.throws(() => networkStrikeResponse(sys, [1, 2]), /3 entries/);
});

test('pickup scale is one number for the whole network: equal force gives equal scale in every direction; pickup modes use it', () => {
  const sys = randomSystem(21, 3), scale = networkPickupScale(sys);
  let peak = 0; for (let b = 0; b < 3; b++) for (let i = 0; i < 3; i++) for (const m of networkPickupModes(sys, [0, 1, 2].map(k => (k === b ? 1 : 0)), i, { scale })) peak = Math.max(peak, Math.abs(m.amplitude));
  assert.ok(Math.abs(peak - 0.19) < 1e-12, 'the largest modal amplitude over all unit impulses and pickups is the level');
  const modes = networkPickupModes(sys, [1, 0, 0], 1);
  assert.equal(modes.length, 3); assert.ok(modes.every(m => m.phase === 0 && m.decay > 0 && Number.isFinite(m.frequency)));
  assert.throws(() => networkPickupModes(sys, [1, 0, 0], 3), /body must be/);
});
