import test from 'node:test';
import assert from 'node:assert/strict';
import { coupledNetwork, networkStrikeResponse, modalNetwork } from '../src/coupling.js';
import { modesOf, GEOMETRY_MATERIALS } from '../src/geometry.js';

const lumped = (hz, mass, gamma) => ({ mass, frequencies: [hz], decayRates: [gamma], shape: () => [1] });
/** A beam-partial body: frequencies from the grove tuning with clamped-free ratios, decay rates ∝ frequency (constant loss factor), shapes from geometry.js. */
function beamBody(hz, mass, gamma, M = 3) {
  const set = modesOf({ kind: 'beam', support: 'clamped-free', material: GEOMETRY_MATERIALS.steel, lengthM: 0.065, thicknessM: 0.001, widthM: 0.01 }, { count: M });
  const ratios = set.freqsHz.map(f => f / set.freqsHz[0]);
  return { mass, frequencies: ratios.map(r => hz * r), decayRates: ratios.map(r => gamma * r), shape: u => set.weightsAt(u) };
}

test('M = 1 with unit shapes reproduces coupledNetwork exactly: modes, displacement and pickup modes', () => {
  const masses = [0.02, 0.03, 0.015], hz = [196, 199.2, 194.5], gamma = 0.45, kc = 0.006 * 0.02 * (2 * Math.PI * 196) ** 2;
  const net = coupledNetwork({ masses, frequencies: hz, edges: [{ a: 0, b: 1, kc }, { a: 1, b: 2, kc: kc * 0.7 }], gamma });
  const modal = modalNetwork({ bodies: hz.map((f, i) => lumped(f, masses[i], gamma)), edges: [{ a: 0, b: 1, kc, ua: 1, ub: 1 }, { a: 1, b: 2, kc: kc * 0.7, ua: 1, ub: 1 }] });
  assert.ok(net.normalFreqsHz.every((f, r) => Math.abs(f - modal.normalFreqsHz[r]) < 1e-12 * f));
  assert.ok(modal.gammas.every(g => Math.abs(g - gamma) < 1e-12), 'uniform partial rates give the pair\'s γ for every mode');
  const a = networkStrikeResponse(net, [0.01, 0, 0]), b = modal.strike(0, 1, 0.01);
  let scale = 0; for (let t = 0; t <= 2; t += 0.011) scale = Math.max(scale, ...a.x(t).map(Math.abs));
  for (let t = 0; t <= 2; t += 0.011) for (let i = 0; i < 3; i++) { assert.ok(Math.abs(a.x(t)[i] - b.displacement(i, 1, t)) < 1e-12 * scale, `x at ${t}`); assert.ok(Math.abs(a.v(t)[i] - b.velocity(i, 1, t)) < 1e-12 * scale * 2 * Math.PI * 300, `v at ${t}`); }
  for (let i = 0; i < 3; i++) { const am = a.bodyModes(i), bm = b.bodyModes(i, 1); for (let r = 0; r < 3; r++) assert.ok(Math.abs(Math.abs(am[r].amplitude) - Math.abs(bm[r].amplitude)) < 1e-12 * (Math.abs(am[r].amplitude) + 1e-300)); }
  assert.ok(modal.participationByBody.every(p => Math.abs(p.reduce((s, x) => s + x, 0) - 1) < 1e-12));
});

test('partials: the undamped closed form satisfies the equations of motion; strike position selects partials; decays are assigned within the partial range', () => {
  const bodies = [beamBody(196, 0.02, 0.45), beamBody(199.2, 0.03, 0.45), beamBody(194.5, 0.015, 0.45)];
  const kc = 0.006 * 0.02 * (2 * Math.PI * 196) ** 2;
  const sys = modalNetwork({ bodies, edges: [{ a: 0, b: 1, kc, ua: 1, ub: 1 }, { a: 1, b: 2, kc: kc * 0.7, ua: 0.8, ub: 1 }] });
  assert.equal(sys.n, 9); assert.ok(sys.eigen.residual < 1e-12 && sys.eigen.orthogonality < 1e-12);
  // undamped EOM check: build the same system with zero decay rates and verify M q̈ + K q = 0 by central differences
  const undamped = modalNetwork({ bodies: bodies.map(b => ({ ...b, decayRates: b.decayRates.map(() => 0) })), edges: [{ a: 0, b: 1, kc, ua: 1, ub: 1 }, { a: 1, b: 2, kc: kc * 0.7, ua: 0.8, ub: 1 }] });
  const r = undamped.strike(0, 0.6, 0.01), h = 1e-6;
  let scale = 0; for (let t = 0; t <= 0.3; t += 0.01) scale = Math.max(scale, ...r.q(t).map(Math.abs));
  for (let t = 0.03; t <= 0.3; t += 0.041) {
    const q = r.q(t), qp = r.q(t + h), qm = r.q(t - h);
    for (let k = 0; k < undamped.n; k++) { const acc = (qp[k] - 2 * q[k] + qm[k]) / (h * h); let kq = 0; for (let l = 0; l < undamped.n; l++) kq += undamped.K[k][l] * q[l]; const res = undamped.m[k] * acc + kq, ref = undamped.m[k] * (2 * Math.PI * 2000) ** 2 * scale; assert.ok(Math.abs(res) / ref < 1e-4, `EOM residual ${res / ref} at coordinate ${k}, t ${t}`); }
  }
  // strike position: at a node of partial 2 of body 0 (shape_2(u) ≈ 0), the second partial's initial velocity vanishes
  const set = modesOf({ kind: 'beam', support: 'clamped-free', material: GEOMETRY_MATERIALS.steel, lengthM: 0.065, thicknessM: 0.001, widthM: 0.01 }, { count: 3 });
  let node = 0.5, best = Infinity; for (let u = 0.3; u <= 0.95; u += 0.0005) { const w = Math.abs(set.weightsAt(u)[1]); if (w < best) { best = w; node = u; } }
  assert.ok(best < 1e-3, `a node of the second partial exists near u = ${node.toFixed(3)}`);
  const atNode = sys.strike(0, node, 0.01), atTip = sys.strike(0, 1, 0.01);
  const partial2Share = strike => { let s = 0, total = 0; for (let r = 0; r < sys.n; r++) { const contrib = strike.coeff[r] * sys.vectors[r][1]; s += contrib * contrib; total += strike.coeff[r] ** 2; } return s / total; };
  assert.ok(partial2Share(atNode) < 0.02 * partial2Share(atTip) + 1e-9, 'striking at the node leaves the second partial almost silent');
  const rates = bodies.flatMap(b => b.decayRates);
  assert.ok(sys.gammas.every(g => g >= Math.min(...rates) - 1e-12 && g <= Math.max(...rates) + 1e-12), 'assigned decays lie within the partial decay range');
  assert.ok(sys.gammas.some(g => g > 0.46) && sys.gammas.some(g => g < 0.46 * 4), 'higher coupled modes decay faster than the fundamentals');
  assert.ok(/classical-damping approximation/.test(sys.damping));
  assert.ok(sys.normalFreqsHz.at(-1) > 5 * sys.normalFreqsHz[0], 'the voice now spans partials, not three near-unison modes only');
});

test('validation: shapes must return one finite weight per partial; bounds; malformed edges', () => {
  const b = lumped(200, 0.02, 0.3);
  assert.throws(() => modalNetwork({ bodies: [{ ...b, shape: () => [1, 2] }], edges: [{ a: 0, b: 0, kc: 1, ua: 1, ub: 1 }] }), /itself/);
  assert.throws(() => modalNetwork({ bodies: [b, { ...b, shape: () => [NaN] }], edges: [{ a: 0, b: 1, kc: 1, ua: 1, ub: 1 }] }), /finite weights/);
  assert.throws(() => modalNetwork({ bodies: [b, b], edges: [{ a: 0, b: 1, kc: 1, ua: 1, ub: 1 }, { a: 1, b: 0, kc: 1, ua: 1, ub: 1 }] }), /duplicate/);
  assert.throws(() => modalNetwork({ bodies: [{ ...b, decayRates: [1, 2] }] }), /equal length/);
  assert.throws(() => modalNetwork({ bodies: Array.from({ length: 9 }, () => beamBody(200, 0.02, 0.3, 3)) }), /at most 24/);
  assert.throws(() => modalNetwork({ bodies: [{ ...b, decayRates: [5000] }] }), /not underdamped/);
  const sys = modalNetwork({ bodies: [b, b], edges: [{ a: 0, b: 1, kc: 10, ua: 1, ub: 1 }] });
  assert.throws(() => sys.strike(2, 1), /body index/);
  assert.throws(() => sys.strike(0, 1.5), /position in \[0, 1\]/);
  assert.throws(() => modalNetwork({ bodies: [b, b], edges: [{ a: 0, b: 1, kc: 10, ua: -0.1, ub: 1 }] }), /position in \[0, 1\]/);
  const r = sys.strike(0, 1); assert.throws(() => r.displacement(2, 1, 0.1), /pickup body/); assert.throws(() => r.bodyModes(0, 2), /position in/);
  // snapshot: mutating the caller's data after construction changes nothing
  const mutable = { mass: 0.02, frequencies: [200], decayRates: [0.3], shape: () => [1] }, sys2 = modalNetwork({ bodies: [mutable, { ...mutable }], edges: [{ a: 0, b: 1, kc: 10, ua: 1, ub: 1 }] });
  const before = sys2.strike(0, 1, 0.01).displacement(1, 1, 0.3);
  mutable.mass = 0.5; mutable.frequencies[0] = 50; mutable.decayRates[0] = 9;
  assert.equal(sys2.strike(0, 1, 0.01).displacement(1, 1, 0.3), before);
  assert.throws(() => { sys2.snapshot[0].frequencies[0] = 1; }, TypeError);
  assert.ok(Number.isFinite(sys2.dampingResidual));
});

test('damping approximation evidence: discarded off-diagonal damping is reported, and the closed form tracks a direct damped ODE for a representative grove voice', () => {
  const bodies = [beamBody(196, 0.02, 0.45), beamBody(199.2, 0.03, 0.45), beamBody(194.5, 0.015, 0.45)];
  const kc = 0.006 * 0.02 * (2 * Math.PI * 196) ** 2, edges = [{ a: 0, b: 1, kc, ua: 1, ub: 1 }, { a: 1, b: 2, kc: kc * 0.7, ua: 0.8, ub: 1 }];
  const sys = modalNetwork({ bodies, edges });
  assert.ok(Number.isFinite(sys.dampingResidual) && sys.dampingResidual >= 0 && sys.dampingResidual < 1, `discarded off-diagonal damping, relative Frobenius: ${sys.dampingResidual}`);
  // Direct integration of M q̈ + C q̇ + K q = 0 with C = diag(2 m_k γ_k) (the pair's 2γM convention per partial), RK4, from the strike's initial velocity.
  const strike = sys.strike(0, 0.6, 0.01), n = sys.n, rates = bodies.flatMap(b => b.decayRates);
  let q = new Array(n).fill(0), v = strike.qdot0Coordinates.slice();
  const acc = (q, v) => q.map((_, k) => { let kq = 0; for (let l = 0; l < n; l++) kq += sys.K[k][l] * q[l]; return -(2 * rates[k] * v[k]) - kq / sys.m[k]; });
  const h = 1 / 96000, T = 0.6; let maxErr = 0, scale = 0;
  for (let step = 1; step * h <= T; step++) {
    const k1q = v, k1v = acc(q, v);
    const q2 = q.map((x, k) => x + 0.5 * h * k1q[k]), v2 = v.map((x, k) => x + 0.5 * h * k1v[k]), k2q = v2, k2v = acc(q2, v2);
    const q3 = q.map((x, k) => x + 0.5 * h * k2q[k]), v3 = v.map((x, k) => x + 0.5 * h * k2v[k]), k3q = v3, k3v = acc(q3, v3);
    const q4 = q.map((x, k) => x + h * k3q[k]), v4 = v.map((x, k) => x + h * k3v[k]), k4q = v4, k4v = acc(q4, v4);
    q = q.map((x, k) => x + h / 6 * (k1q[k] + 2 * k2q[k] + 2 * k3q[k] + k4q[k])); v = v.map((x, k) => x + h / 6 * (k1v[k] + 2 * k2v[k] + 2 * k3v[k] + k4v[k]));
    if (step % 48 === 0) { const t = step * h, closed = strike.q(t); for (let k = 0; k < n; k++) { scale = Math.max(scale, Math.abs(q[k])); maxErr = Math.max(maxErr, Math.abs(q[k] - closed[k])); } }
  }
  const relative = maxErr / scale;
  console.log(`classical-damping approximation vs direct damped ODE (0.6 s, 9 coordinates): max |Δq| / max |q| = ${relative.toExponential(3)}; discarded off-diagonal damping ${sys.dampingResidual.toExponential(3)} (relative Frobenius)`);
  assert.ok(relative < 0.05, `closed form within 5% of the direct damped integration (got ${relative})`);
});
