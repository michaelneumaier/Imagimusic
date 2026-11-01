// Reciprocal energy exchange between two lumped resonators (proposal 003, revised per Astra's Loom note).
// Two masses on springs joined by a coupling spring, with mass-proportional damping. Closed-form response to an
// impulse via the symmetric 2×2 eigensystem: no integration, any t, exact zero-coupling limit, real back-reaction.
//
//   M ẍ + 2γ M ẋ + K x = 0,   K = [[m1 ω1² + kc, −kc], [−kc, m2 ω2² + kc]]
//   mass-normalized y = M^{1/2} x:  ÿ + 2γ ẏ + A y = 0,  A = [[ω1² + kc/m1, −kc/√(m1 m2)], [−kc/√(m1 m2), ω2² + kc/m2]]
//   normal coordinates q_j = v_j · y (v_j orthonormal eigenvectors of A, eigenvalues λ_j):
//     q_j(t) = (q̇_j(0) / ω_dj) e^{−γ t} sin(ω_dj t),  ω_dj = √(λ_j − γ²)   (underdamped: λ_j > γ² required)
//   impulse J = [J1, J2] (N·s) at t = 0 with x(0) = 0:  ẏ(0) = [J1/√m1, J2/√m2],  q̇_j(0) = v_j · ẏ(0)
//   x(t) = M^{−1/2} Σ_j q_j(t) v_j
//
// What is physical here: the exchange of energy between the two bodies, its rate (set by kc and detuning), the two
// normal frequencies and their common decay 1/γ. What is a stated convention: the sound pickup (displacement of a
// body, normalized separately from mechanical energy). This is a reduced two-degree-of-freedom model, not an elastic
// bridge; timbre beyond the two normal modes and radiation are separate interpretation choices.

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const positive = (v, name) => { finite(v, name); if (v <= 0) throw new Error(`${name} must be positive.`); return v; };
const nonNegative = (v, name) => { finite(v, name); if (v < 0) throw new Error(`${name} must be non-negative.`); return v; };

/** Build the coupled system. f1, f2 in Hz (uncoupled natural frequencies), kc in N/m, gamma in 1/s (amplitude decay rate). */
export function coupledPair({ m1 = 1, m2 = 1, f1, f2, kc = 0, gamma = 0 } = {}) {
  positive(m1, 'm1'); positive(m2, 'm2'); positive(f1, 'f1'); positive(f2, 'f2'); nonNegative(kc, 'kc'); nonNegative(gamma, 'gamma');
  const w1 = 2 * Math.PI * f1, w2 = 2 * Math.PI * f2;
  const a = w1 * w1 + kc / m1, d = w2 * w2 + kc / m2, b = -kc / Math.sqrt(m1 * m2);
  const K = [[m1 * w1 * w1 + kc, -kc], [-kc, m2 * w2 * w2 + kc]];
  for (const [name, value] of [['ω1²', w1 * w1], ['ω2²', w2 * w2], ['kc/m1', kc / m1], ['kc/m2', kc / m2], ['A11', a], ['A22', d], ['A12', b], ['γ²', gamma * gamma], ['K11', K[0][0]], ['K22', K[1][1]]]) {
    if (!Number.isFinite(value)) throw new RangeError(`derived quantity ${name} is not finite; inputs are outside the representable range.`);
  }
  const mean = (a + d) / 2, half = (a - d) / 2, r = Math.hypot(half, b);
  const lambda = [mean - r, mean + r];
  let vectors;
  if (b === 0) {
    // Exactly uncoupled (kc = 0): the bodies are their own normal modes, exactly. The only shortcut.
    vectors = a <= d ? [[1, 0], [0, 1]] : [[0, 1], [1, 0]];
  } else {
    // Stable symmetric 2×2 diagonalization by rotation: θ = ½·atan2(2b, a − d). [cos θ, sin θ] belongs to the
    // larger eigenvalue mean + r, its orthogonal complement [−sin θ, cos θ] to mean − r. No λ − a cancellation, and a
    // tiny coupling between equal frequencies yields the proper ±45° eigenbasis instead of a false diagonal one.
    const theta = 0.5 * Math.atan2(2 * b, a - d), c = Math.cos(theta), s = Math.sin(theta);
    vectors = [[-s, c], [c, s]];
  }
  for (const l of lambda) if (!Number.isFinite(l)) throw new RangeError('eigenvalues are not finite; inputs are outside the representable range.');
  for (const l of lambda) if (l <= gamma * gamma) throw new Error(`system is not underdamped: eigenvalue ${l} ≤ γ² = ${gamma * gamma}.`);
  const omegaD = lambda.map(l => Math.sqrt(l - gamma * gamma));
  if (!omegaD.every(Number.isFinite)) throw new RangeError('damped frequencies are not finite.');
  return { m: [m1, m2], f: [f1, f2], kc, gamma, A: [[a, b], [b, d]], K, lambda, omegaD, vectors, normalFreqsHz: omegaD.map(w => w / (2 * Math.PI)), decayS: gamma > 0 ? 1 / gamma : Infinity };
}

/** Closed-form response of the pair to an impulse J = [J1, J2] applied at t = 0 to bodies at rest. */
export function strikeResponse(system, impulse) {
  if (!Array.isArray(impulse) || impulse.length !== 2) throw new Error('impulse must be [J1, J2].');
  impulse.forEach((j, i) => finite(j, `impulse[${i}]`));
  const { m, vectors, lambda, omegaD, gamma, K } = system;
  const ydot0 = [impulse[0] / Math.sqrt(m[0]), impulse[1] / Math.sqrt(m[1])];
  const qdot0 = vectors.map(v => v[0] * ydot0[0] + v[1] * ydot0[1]);
  const coeff = qdot0.map((qd, j) => qd / omegaD[j]);                   // q_j(t) = coeff_j e^{−γt} sin(ω_dj t)
  const x = t => {
    finite(t, 't'); if (t < 0) return [0, 0];
    const decay = Math.exp(-gamma * t);
    const q = coeff.map((c, j) => c * decay * Math.sin(omegaD[j] * t));
    const y = [q[0] * vectors[0][0] + q[1] * vectors[1][0], q[0] * vectors[0][1] + q[1] * vectors[1][1]];
    return [y[0] / Math.sqrt(m[0]), y[1] / Math.sqrt(m[1])];
  };
  const v = t => {
    finite(t, 't'); if (t < 0) return [0, 0];
    const decay = Math.exp(-gamma * t);
    const qd = coeff.map((c, j) => c * decay * (omegaD[j] * Math.cos(omegaD[j] * t) - gamma * Math.sin(omegaD[j] * t)));
    const yd = [qd[0] * vectors[0][0] + qd[1] * vectors[1][0], qd[0] * vectors[0][1] + qd[1] * vectors[1][1]];
    return [yd[0] / Math.sqrt(m[0]), yd[1] / Math.sqrt(m[1])];
  };
  const energy = t => {
    const xs = x(t), vs = v(t);
    const kinetic = 0.5 * (m[0] * vs[0] * vs[0] + m[1] * vs[1] * vs[1]);
    const potential = 0.5 * (K[0][0] * xs[0] * xs[0] + 2 * K[0][1] * xs[0] * xs[1] + K[1][1] * xs[1] * xs[1]);
    return kinetic + potential;
  };
  // Each body's displacement is a sum of two decaying sines at the normal frequencies: the additive-synthesis view.
  const bodyModes = i => lambda.map((_, j) => ({ frequency: omegaD[j] / (2 * Math.PI), amplitude: coeff[j] * vectors[j][i] / Math.sqrt(m[i]), decay: gamma > 0 ? 1 / gamma : Infinity }));
  return { x, v, energy, coeff, qdot0, bodyModes, energy0: energy(0) };
}

/**
 * Sound of body i as additive modes in the garden's {frequency, amplitude, decay} shape.
 * PICKUP CONVENTION: displacement of body i. Amplitudes are SIGNED modal coefficients (a negative amplitude is a
 * sine of opposite sign, which additive synthesis renders natively), so the interference that moves energy between
 * the bodies is preserved; both bodies use the same convention and the same normalization: the larger |coefficient|
 * across both bodies maps to `level`. Mechanical energy and sound level are deliberately separate.
 */
export function pickupModes(system, impulse, body, { level = 0.19 } = {}) {
  if (body !== 0 && body !== 1) throw new Error('body must be 0 or 1.');
  if (!Number.isFinite(level) || level < 0) throw new Error('level must be a finite non-negative number.');
  const r = strikeResponse(system, impulse);
  const all = [0, 1].map(i => r.bodyModes(i));
  const peak = Math.max(...all.flat().map(m => Math.abs(m.amplitude)), 1e-300);
  // phase is always 0: the sign of the coefficient carries the π case. Kept as a field so adapters can add it uniformly.
  return all[body].map(m => ({ frequency: m.frequency, amplitude: level * m.amplitude / peak, phase: 0, decay: m.decay }));
}

/**
 * Coherent superposition of repeated strikes on ONE fixed system (the model is linear, so the response to several
 * impulses is the sum of the time-shifted single-strike responses; a strike arriving while the bodies still move
 * adds to their displacement and velocity, it does not reset them). strikes: [{ t, impulse: [J1, J2] }].
 * Energy is computed from the SUMMED state through M and K, not as a sum of per-strike energies (cross terms are
 * real: a second strike in phase adds energy, out of phase removes it).
 */
export function superposeStrikes(system, strikes) {
  if (!Array.isArray(strikes)) throw new Error('strikes must be an array of { t, impulse }.');
  const parts = strikes.map((s, i) => { finite(s?.t, `strikes[${i}].t`); return { t: s.t, r: strikeResponse(system, s.impulse) }; });
  const { m, K } = system;
  const sum = (fn, t) => { finite(t, 't'); const out = [0, 0]; for (const { t: t0, r } of parts) { if (t < t0) continue; const v = r[fn](t - t0); out[0] += v[0]; out[1] += v[1]; } return out; };
  const x = t => sum('x', t), v = t => sum('v', t);
  const energy = t => {
    const xs = x(t), vs = v(t);
    return 0.5 * (m[0] * vs[0] * vs[0] + m[1] * vs[1] * vs[1]) + 0.5 * (K[0][0] * xs[0] * xs[0] + 2 * K[0][1] * xs[0] * xs[1] + K[1][1] * xs[1] * xs[1]);
  };
  // Per-strike modes for additive synthesis: the same signed coefficients, each with its own onset.
  const modes = body => parts.map(({ t: t0, r }) => ({ onset: t0, modes: r.bodyModes(body) }));
  return { x, v, energy, strikes: parts.map(p => p.t), modes };
}

/** Peak |x_i| over [0, horizon] sampled finely: the transfer evidence for tests and captions. */
export function peakDisplacement(response, body, horizon, samples = 4000) {
  let peak = 0;
  for (let k = 0; k <= samples; k++) { const xs = response.x(horizon * k / samples); peak = Math.max(peak, Math.abs(xs[body])); }
  return peak;
}

// ---------------------------------------------------------------------------------------------------------------
// Coupled NETWORK (proposal 014, The Grove): N lumped masses on their own springs, joined by bridge springs on the
// given edges, with the pair's damping convention exactly:  M ẍ + 2γ M ẋ + K x = 0,  amplitude decay e^{−γt},
// damped frequencies √(λ − γ²), underdamped required.  K_ii = m_i ω_i² + Σ_{edges at i} kc,  K_ab = −kc.
// Mass-normalized A = M^{−1/2} K M^{−1/2} is symmetric; its modes come from cyclic Jacobi rotations (dependency-free).
// Degenerate eigenvalues have an arbitrary basis, sign and order: only reconstructed x(t), v(t) and modal frequencies
// are meaningful; tests compare those. `coupledPair` above is untouched; for N = 2 the two agree to rounding.
// What is physical: the modal frequencies, each body's participation in each mode, and the common decay. What is a
// stated convention: the sound pickup (displacement of a body) and one pickup level normalized over ALL unit-impulse
// directions and all pickups, so equal force means equal pickup scale wherever it lands.

export const NETWORK_MAX_BODIES = 8;

/** Cyclic Jacobi eigen-decomposition of a symmetric matrix. Returns ascending eigenvalues and orthonormal eigenvectors (rows). */
export function symmetricEigen(matrix, { sweeps = 100, relativeTolerance = 1e-15 } = {}) {
  if (!Array.isArray(matrix) || matrix.length < 1 || matrix.some(row => !Array.isArray(row) || row.length !== matrix.length)) throw new Error('matrix must be a non-empty square array of arrays.');
  const n = matrix.length;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) finite(matrix[i][j], `matrix[${i}][${j}]`);
  if (!Number.isInteger(sweeps) || sweeps < 1 || sweeps > 1000) throw new Error('sweeps must be an integer in 1..1000.');
  if (!(relativeTolerance > 0 && relativeTolerance < 1)) throw new Error('relativeTolerance must be within (0, 1).');
  // Overflow-safe Frobenius norm: scale by the largest magnitude first (a finite matrix always has a finite norm this way).
  const maxAbs = Math.max(...matrix.flat().map(Math.abs));
  const frobenius = rows => { const m = Math.max(...rows.flat().map(Math.abs)); return m === 0 ? 0 : m * Math.sqrt(rows.flat().reduce((s, x) => s + (x / m) * (x / m), 0)); };
  const norm = frobenius(matrix) || 1;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (Math.abs(matrix[i][j] - matrix[j][i]) > 1e-12 * (maxAbs || 1)) throw new Error(`matrix is not symmetric at [${i}][${j}].`);
  const a = matrix.map(row => row.slice()), v = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
  let converged = false;
  for (let sweep = 0; sweep <= sweeps; sweep++) {
    let off = 0; for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += (a[p][q] / norm) * (a[p][q] / norm);
    if (Math.sqrt(off) <= relativeTolerance) { converged = true; break; }
    if (sweep === sweeps) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (a[p][q] === 0) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const akp = a[k][p], akq = a[k][q]; a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq; }
      for (let k = 0; k < n; k++) { const apk = a[p][k], aqk = a[q][k]; a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk; }
      for (let k = 0; k < n; k++) { const vkp = v[k][p], vkq = v[k][q]; v[k][p] = c * vkp - s * vkq; v[k][q] = s * vkp + c * vkq; }
    }
  }
  if (!converged) throw new Error(`symmetricEigen did not converge in ${sweeps} sweeps.`);
  const order = Array.from({ length: n }, (_, j) => j).sort((i, j) => a[i][i] - a[j][j]);
  const lambda = order.map(j => a[j][j]), vectors = order.map(j => v.map(row => row[j]));   // vectors[j] is the j-th eigenvector
  // Residual and orthogonality, relative to the matrix norm: reported so callers and tests can assert them.
  let residual = 0, ortho = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { let av = 0; for (let k = 0; k < n; k++) av += (matrix[i][k] / norm) * vectors[j][k]; residual += (av - (lambda[j] / norm) * vectors[j][i]) ** 2; }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { let d = 0; for (let k = 0; k < n; k++) d += vectors[i][k] * vectors[j][k]; ortho += (d - (i === j ? 1 : 0)) ** 2; }
  const out = { lambda, vectors, residual: Math.sqrt(residual), orthogonality: Math.sqrt(ortho) };
  if (!Number.isFinite(out.residual) || !Number.isFinite(out.orthogonality)) throw new Error('eigen-decomposition quality is not finite.');
  return out;
}

/** Build the network. masses (kg), frequencies (Hz, uncoupled), edges [{ a, b, kc }] (N/m), gamma (1/s). */
export function coupledNetwork({ masses, frequencies, edges = [], gamma = 0 } = {}) {
  if (!Array.isArray(masses) || !Array.isArray(frequencies) || masses.length !== frequencies.length) throw new Error('masses and frequencies must be arrays of the same length.');
  const n = masses.length;
  if (n < 2 || n > NETWORK_MAX_BODIES) throw new Error(`a network needs 2..${NETWORK_MAX_BODIES} bodies.`);
  masses.forEach((m, i) => positive(m, `masses[${i}]`)); frequencies.forEach((f, i) => positive(f, `frequencies[${i}]`)); nonNegative(gamma, 'gamma');
  if (!Array.isArray(edges)) throw new Error('edges must be an array of { a, b, kc }.');
  const seen = new Set();
  for (const [i, e] of edges.entries()) {
    if (!e || !Number.isInteger(e.a) || !Number.isInteger(e.b) || e.a < 0 || e.b < 0 || e.a >= n || e.b >= n) throw new Error(`edges[${i}]: a and b must be body indices.`);
    if (e.a === e.b) throw new Error(`edges[${i}]: a body cannot be bridged to itself.`);
    const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`; if (seen.has(key)) throw new Error(`edges[${i}]: duplicate bridge ${key}.`); seen.add(key);
    nonNegative(e.kc, `edges[${i}].kc`);
  }
  const w = frequencies.map(f => 2 * Math.PI * f), K = Array.from({ length: n }, (_, i) => Array.from({ length: n }, () => 0));
  for (let i = 0; i < n; i++) K[i][i] = masses[i] * w[i] * w[i];
  for (const e of edges) { K[e.a][e.a] += e.kc; K[e.b][e.b] += e.kc; K[e.a][e.b] -= e.kc; K[e.b][e.a] -= e.kc; }
  const A = K.map((row, i) => row.map((k, j) => k / Math.sqrt(masses[i] * masses[j])));
  for (const row of [...K, ...A]) for (const value of row) if (!Number.isFinite(value)) throw new RangeError('derived stiffness is not finite; inputs are outside the representable range.');
  const { lambda, vectors, residual, orthogonality } = symmetricEigen(A);
  if (!(residual <= 1e-10) || !(orthogonality <= 1e-10)) throw new Error(`eigen-decomposition did not meet the network's quality bound (residual ${residual}, orthogonality ${orthogonality}).`);
  for (const l of lambda) if (!Number.isFinite(l)) throw new RangeError('eigenvalues are not finite.');
  for (const l of lambda) if (l <= gamma * gamma) throw new Error(`system is not underdamped: eigenvalue ${l} ≤ γ² = ${gamma * gamma}.`);
  const omegaD = lambda.map(l => Math.sqrt(l - gamma * gamma));
  return { n, m: masses.slice(), f: frequencies.slice(), edges: edges.map(e => ({ a: e.a, b: e.b, kc: e.kc })), gamma, A, K, lambda, omegaD, vectors, normalFreqsHz: omegaD.map(x => x / (2 * Math.PI)), decayS: gamma > 0 ? 1 / gamma : Infinity, eigen: { residual, orthogonality } };
}

/** Closed-form response of the network to an impulse vector J (N·s per body) at t = 0 from rest. */
export function networkStrikeResponse(system, impulse) {
  const { n, m, vectors, omegaD, gamma } = system;
  if (!Array.isArray(impulse) || impulse.length !== n) throw new Error(`impulse must have ${n} entries.`);
  impulse.forEach((j, i) => finite(j, `impulse[${i}]`));
  const ydot0 = impulse.map((j, i) => j / Math.sqrt(m[i]));
  const qdot0 = vectors.map(v => v.reduce((s, vi, i) => s + vi * ydot0[i], 0));
  const coeff = qdot0.map((qd, j) => qd / omegaD[j]);                   // q_j(t) = coeff_j e^{−γt} sin(ω_dj t)
  const combine = q => { const y = new Array(n).fill(0); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) y[i] += q[j] * vectors[j][i]; return y.map((yi, i) => yi / Math.sqrt(m[i])); };
  const x = t => { finite(t, 't'); if (t < 0) return new Array(n).fill(0); const d = Math.exp(-gamma * t); return combine(coeff.map((c, j) => c * d * Math.sin(omegaD[j] * t))); };
  const v = t => { finite(t, 't'); if (t < 0) return new Array(n).fill(0); const d = Math.exp(-gamma * t); return combine(coeff.map((c, j) => c * d * (omegaD[j] * Math.cos(omegaD[j] * t) - gamma * Math.sin(omegaD[j] * t)))); };
  const bodyModes = i => coeff.map((c, j) => ({ frequency: omegaD[j] / (2 * Math.PI), amplitude: c * vectors[j][i] / Math.sqrt(m[i]), decay: gamma > 0 ? 1 / gamma : Infinity }));
  /** Each body's share of each mode: |v_j[i]|², which sums to 1 over bodies for every mode (a participation table for the picture). */
  const participation = vectors.map(v => v.map(vi => vi * vi));
  return { x, v, coeff, qdot0, bodyModes, participation };
}

/** One pickup level for the whole network: `level` maps the largest |modal amplitude| over all unit impulses and all pickups. */
export function networkPickupScale(system, { level = 0.19 } = {}) {
  if (!Number.isFinite(level) || level < 0) throw new Error('level must be a finite non-negative number.');
  let peak = 1e-300;
  for (let b = 0; b < system.n; b++) { const r = networkStrikeResponse(system, system.m.map((_, i) => (i === b ? 1 : 0))); for (let i = 0; i < system.n; i++) for (const mode of r.bodyModes(i)) peak = Math.max(peak, Math.abs(mode.amplitude)); }
  return level / peak;
}

/** Sound of body `body` for an impulse, as signed additive modes (the pair's convention), scaled by the network-wide pickup scale. */
export function networkPickupModes(system, impulse, body, { scale = networkPickupScale(system) } = {}) {
  if (!Number.isInteger(body) || body < 0 || body >= system.n) throw new Error(`body must be 0..${system.n - 1}.`);
  if (!Number.isFinite(scale) || scale < 0) throw new Error('scale must be a finite non-negative number.');
  return networkStrikeResponse(system, impulse).bodyModes(body).map(m => ({ frequency: m.frequency, amplitude: scale * m.amplitude, phase: 0, decay: m.decay }));
}

// ---------------------------------------------------------------------------------------------------------------
// MODAL network (proposal 015, a richer voice for the Grove): each body has M partial coordinates q_aj with shapes
// φ_aj(u) along its normalized length, natural frequencies ω_aj and a per-partial decay rate γ_aj; a bridge attached
// at u_a on body a and u_b on body b adds the potential ½ kc (w_a(u_a) − w_b(u_b))², w_a(u) = Σ_j φ_aj(u) q_aj, which
// couples EVERY partial that moves at the attachment point. A strike at s on body a gives q̇_aj(0) = J φ_aj(s)/m_aj.
// Conventions, stated: equal modal mass m_a for every partial of body a (uniform-body approximation with shapes as
// dimensionless weights, the garden's convention); the undamped eigenproblem is exact (symmetricEigen); the decay of
// each COUPLED normal mode is assigned as the participation-weighted mean of the partial decay rates it is made of
// (classical-damping approximation, named in every caption); each mode then follows the pair's form
// q_r(t) = (q̇_r(0)/ω_dr) e^{−γ_r t} sin(ω_dr t), ω_dr = √(λ_r − γ_r²). With M = 1 and shapes ≡ 1 the system is
// exactly `coupledNetwork` (tested).

export const MODAL_MAX_COORDINATES = 24;

/** bodies: [{ mass, frequencies: [Hz], decayRates: [1/s], shape: (u01) => [φ_1(u), …, φ_M(u)] }]; edges: [{ a, b, kc, ua, ub }]. */
export function modalNetwork({ bodies: input, edges = [] } = {}) {
  if (!Array.isArray(input) || input.length < 1) throw new Error('bodies must be a non-empty array.');
  // Snapshot every number at construction: later mutation of the caller's arrays or mass cannot reach the system. The shape
  // callback is kept by reference and MUST be pure and deterministic in u (a closure cannot be frozen; this is the stated contract).
  const bodies = input.map((b, a) => {
    if (!b || typeof b !== 'object') throw new Error(`bodies[${a}] must be an object.`);
    positive(b.mass, `bodies[${a}].mass`);
    if (!Array.isArray(b.frequencies) || !b.frequencies.length || !Array.isArray(b.decayRates) || b.decayRates.length !== b.frequencies.length) throw new Error(`bodies[${a}]: frequencies and decayRates must be non-empty arrays of equal length.`);
    b.frequencies.forEach((f, j) => positive(f, `bodies[${a}].frequencies[${j}]`)); b.decayRates.forEach((g, j) => nonNegative(g, `bodies[${a}].decayRates[${j}]`));
    if (typeof b.shape !== 'function') throw new Error(`bodies[${a}].shape must be a pure function of u01 in [0, 1] returning one weight per partial.`);
    return Object.freeze({ mass: b.mass, frequencies: Object.freeze(b.frequencies.slice()), decayRates: Object.freeze(b.decayRates.slice()), shape: b.shape });
  });
  const offsets = [], sizes = [];
  bodies.forEach(b => { offsets.push(sizes.reduce((s, x) => s + x, 0)); sizes.push(b.frequencies.length); });
  const u01 = (v, name) => { finite(v, name); if (v < 0 || v > 1) throw new Error(`${name} must be a position in [0, 1].`); return v; };
  const bodyIndex = (v, name) => { if (!Number.isInteger(v) || v < 0 || v >= bodies.length) throw new Error(`${name} must be a body index 0..${bodies.length - 1}.`); return v; };
  const n = sizes.reduce((s, x) => s + x, 0);
  if (n > MODAL_MAX_COORDINATES) throw new Error(`at most ${MODAL_MAX_COORDINATES} modal coordinates.`);
  const shapeAt = (a, u) => { u01(u, 'u01'); const w = bodies[a].shape(u); if (!Array.isArray(w) || w.length !== sizes[a] || !w.every(Number.isFinite)) throw new Error(`bodies[${a}].shape(${u}) must return ${sizes[a]} finite weights.`); return w; };
  const seen = new Set();
  for (const [i, e] of edges.entries()) {
    if (!e || !Number.isInteger(e.a) || !Number.isInteger(e.b) || e.a < 0 || e.b < 0 || e.a >= bodies.length || e.b >= bodies.length) throw new Error(`edges[${i}]: a and b must be body indices.`);
    if (e.a === e.b) throw new Error(`edges[${i}]: a body cannot be bridged to itself.`);
    const key = `${Math.min(e.a, e.b)}-${Math.max(e.a, e.b)}`; if (seen.has(key)) throw new Error(`edges[${i}]: duplicate bridge ${key}.`); seen.add(key);
    nonNegative(e.kc, `edges[${i}].kc`); u01(e.ua, `edges[${i}].ua`); u01(e.ub, `edges[${i}].ub`);
  }
  // Mass vector and stiffness matrix over all coordinates.
  const m = [], K = Array.from({ length: n }, () => new Array(n).fill(0));
  bodies.forEach((b, a) => b.frequencies.forEach((f, j) => { const k = offsets[a] + j; m[k] = b.mass; K[k][k] = b.mass * (2 * Math.PI * f) ** 2; }));
  for (const e of edges) {
    const pa = shapeAt(e.a, e.ua), pb = shapeAt(e.b, e.ub);
    for (let j = 0; j < sizes[e.a]; j++) for (let k = 0; k < sizes[e.a]; k++) K[offsets[e.a] + j][offsets[e.a] + k] += e.kc * pa[j] * pa[k];
    for (let j = 0; j < sizes[e.b]; j++) for (let k = 0; k < sizes[e.b]; k++) K[offsets[e.b] + j][offsets[e.b] + k] += e.kc * pb[j] * pb[k];
    for (let j = 0; j < sizes[e.a]; j++) for (let k = 0; k < sizes[e.b]; k++) { K[offsets[e.a] + j][offsets[e.b] + k] -= e.kc * pa[j] * pb[k]; K[offsets[e.b] + k][offsets[e.a] + j] -= e.kc * pa[j] * pb[k]; }
  }
  const A = K.map((row, i) => row.map((k, j) => k / Math.sqrt(m[i] * m[j])));
  for (const row of A) for (const value of row) if (!Number.isFinite(value)) throw new RangeError('derived stiffness is not finite; inputs are outside the representable range.');
  const { lambda, vectors, residual, orthogonality } = symmetricEigen(A);
  if (!(residual <= 1e-10) || !(orthogonality <= 1e-10)) throw new Error(`eigen-decomposition did not meet the quality bound (residual ${residual}, orthogonality ${orthogonality}).`);
  // Classical-damping approximation: each normal mode's decay rate is the participation-weighted mean of the partial decay rates.
  const partialRates = []; bodies.forEach((b, a) => b.decayRates.forEach((g, j) => { partialRates[offsets[a] + j] = g; }));
  const gammas = vectors.map(v => v.reduce((s, vi, k) => s + vi * vi * partialRates[k], 0));     // γ_r = v_rᵀ D v_r, D = diag(partial rates) in mass-normalized coordinates
  // What the approximation discards: the off-diagonal part of V D Vᵀ, reported relative to ‖D‖ so the caller can bound it.
  let discarded = 0, dNorm = 0; for (let r = 0; r < n; r++) for (let s2 = 0; s2 < n; s2++) { let d = 0; for (let k = 0; k < n; k++) d += vectors[r][k] * partialRates[k] * vectors[s2][k]; if (r !== s2) discarded += d * d; } for (const g of partialRates) dNorm += g * g;
  const dampingResidual = dNorm > 0 ? Math.sqrt(discarded) / Math.sqrt(dNorm) : 0;
  if (!Number.isFinite(dampingResidual)) throw new Error('damping residual is not finite.');
  lambda.forEach((l, r) => { if (!Number.isFinite(l)) throw new RangeError('eigenvalues are not finite.'); if (l <= gammas[r] * gammas[r]) throw new Error(`mode ${r} is not underdamped: λ ${l} ≤ γ² ${gammas[r] * gammas[r]}.`); });
  const omegaD = lambda.map((l, r) => Math.sqrt(l - gammas[r] * gammas[r]));
  const participationByBody = vectors.map(v => bodies.map((_, a) => { let s = 0; for (let j = 0; j < sizes[a]; j++) s += v[offsets[a] + j] ** 2; return s; }));
  const system = { n, bodies: bodies.length, snapshot: bodies, sizes, offsets, m, K, A, lambda, omegaD, gammas, vectors, normalFreqsHz: omegaD.map(w => w / (2 * Math.PI)), participationByBody, eigen: { residual, orthogonality }, dampingResidual,
    damping: 'classical-damping approximation: each coupled normal mode decays at the participation-weighted mean of its partials\' decay rates; the undamped eigenproblem is exact' };
  /** Closed-form response to a strike of impulse J at position s on body a (bodies at rest). */
  system.strike = (a, s, J = 1) => {
    bodyIndex(a, 'strike body'); u01(s, 'strike position'); finite(J, 'J');
    const w = shapeAt(a, s), ydot0 = new Array(n).fill(0);
    for (let j = 0; j < sizes[a]; j++) ydot0[offsets[a] + j] = (J * w[j] / bodies[a].mass) * Math.sqrt(bodies[a].mass);   // ẏ = √m · q̇
    const qdot0 = vectors.map(v => v.reduce((sum, vi, k) => sum + vi * ydot0[k], 0)), coeff = qdot0.map((qd, r) => qd / omegaD[r]);
    const combine = fn => t => { if (t < 0) return new Array(n).fill(0); const y = new Array(n).fill(0); for (let r = 0; r < n; r++) { const qr = fn(r, t); for (let k = 0; k < n; k++) y[k] += qr * vectors[r][k]; } return y.map((yk, k) => yk / Math.sqrt(m[k])); };
    const q = combine((r, t) => coeff[r] * Math.exp(-gammas[r] * t) * Math.sin(omegaD[r] * t));
    const qdot = combine((r, t) => coeff[r] * Math.exp(-gammas[r] * t) * (omegaD[r] * Math.cos(omegaD[r] * t) - gammas[r] * Math.sin(omegaD[r] * t)));
    const qdot0Coordinates = ydot0.map((yd, k) => yd / Math.sqrt(m[k]));                     // initial velocity in physical coordinates
    /** Displacement and velocity of body b at pickup position p: w_b(p) = Σ_j φ_bj(p) q_bj(t). */
    const displacement = (b, p, t) => { bodyIndex(b, 'pickup body'); const qt = q(t), wb = shapeAt(b, p); let x = 0; for (let j = 0; j < sizes[b]; j++) x += wb[j] * qt[offsets[b] + j]; return x; };
    const velocity = (b, p, t) => { bodyIndex(b, 'pickup body'); const qt = qdot(t), wb = shapeAt(b, p); let x = 0; for (let j = 0; j < sizes[b]; j++) x += wb[j] * qt[offsets[b] + j]; return x; };
    /** Body b's pickup at p as signed additive modes at the normal frequencies: amplitude_r = Σ_j φ_bj(p) coeff_r v_r[(b,j)] / √m_b. */
    const bodyModes = (b, p) => { bodyIndex(b, 'pickup body'); const wb = shapeAt(b, p); return coeff.map((c, r) => ({ frequency: omegaD[r] / (2 * Math.PI), amplitude: c * wb.reduce((s, wj, j) => s + wj * vectors[r][offsets[b] + j], 0) / Math.sqrt(bodies[b].mass), decay: gammas[r] > 0 ? 1 / gammas[r] : Infinity })); };
    return { q, qdot, qdot0Coordinates, displacement, velocity, bodyModes, coeff, qdot0 };
  };
  return system;
}

// ---- state stepper with contact damping (proposal 017: Rest) ----
// Coordinates: mass-normalized displacement y = √m · q over all modal coordinates of a modalNetwork, state x = [y; ẏ].
// Free dynamics: ÿ = −A y − C_free ẏ with C_free = Vᵀ diag(2γ_r) V, i.e. exactly the classical-damping model the modal sums use,
// so with no contact the stepper and the modal sums are the same model. A rest adds a viscous point contact on one body:
// force −c · (wᵀ q̇_b) · w on that body's partials, w = φ_b(u); in mass-normalized coordinates that is C_touch = (c / m_b) · w wᵀ.
// Between gesture boundaries the system is linear and time-invariant, so x(t + h) = exp(S h) x(t) exactly; Φ = exp(S h) is
// computed once per sample rate by scaling and squaring, and stepping is one matrix-vector product per sample.
export const CONTACT_MAX_DAMPING = 1e6;

const matMul = (P, Q, n) => { const R = new Float64Array(n * n); for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) { const p = P[i * n + k]; if (p === 0) continue; for (let j = 0; j < n; j++) R[i * n + j] += p * Q[k * n + j]; } return R; };
/** exp(M) for a dense n×n matrix by scaling and squaring with a Taylor series (‖M/2^s‖₁ ≤ 0.5, 24 terms). */
export function matrixExponential(M, n) {
  let norm = 0; for (let j = 0; j < n; j++) { let s = 0; for (let i = 0; i < n; i++) s += Math.abs(M[i * n + j]); norm = Math.max(norm, s); }
  if (!Number.isFinite(norm)) throw new RangeError('matrix is not finite.');
  const s = norm > 0.5 ? Math.ceil(Math.log2(norm / 0.5)) : 0, scale = 2 ** -s;
  const X = Float64Array.from(M, v => v * scale);
  let result = new Float64Array(n * n), term = new Float64Array(n * n);
  for (let i = 0; i < n; i++) { result[i * n + i] = 1; term[i * n + i] = 1; }
  for (let k = 1; k <= 24; k++) { term = matMul(term, X, n); for (let i = 0; i < n * n; i++) term[i] /= k; for (let i = 0; i < n * n; i++) result[i] += term[i]; }
  for (let i = 0; i < s; i++) result = matMul(result, result, n);
  return result;
}

/** The contact damping matrix (mass-normalized, n×n) of a rest on `body` at position `u` with viscous coefficient c (N·s/m). */
export function contactDamping(network, { body, u, c }) {
  const { n, sizes, offsets, snapshot } = network;
  if (!Number.isInteger(body) || body < 0 || body >= network.bodies) throw new Error(`contact body must be 0..${network.bodies - 1}.`);
  if (!Number.isFinite(u) || u < 0 || u > 1) throw new Error('contact position must be in [0, 1].');
  if (!Number.isFinite(c) || c < 0 || c > CONTACT_MAX_DAMPING) throw new Error(`contact damping must be in [0, ${CONTACT_MAX_DAMPING}].`);
  const w = snapshot[body].shape(u); if (!Array.isArray(w) || w.length !== sizes[body] || !w.every(Number.isFinite)) throw new Error('shape must return one finite weight per partial.');
  const C = new Float64Array(n * n), scale = c / snapshot[body].mass, o = offsets[body];
  for (let j = 0; j < sizes[body]; j++) for (let k = 0; k < sizes[body]; k++) C[(o + j) * n + (o + k)] = scale * w[j] * w[k];
  return C;
}

/** The free damping matrix the modal sums imply: C_free = Vᵀ diag(2γ) V in mass-normalized coordinates. */
export function freeDamping(network) {
  const { n, vectors, gammas } = network, C = new Float64Array(n * n);
  for (let r = 0; r < n; r++) for (let i = 0; i < n; i++) { const vi = 2 * gammas[r] * vectors[r][i]; if (vi === 0) continue; for (let j = 0; j < n; j++) C[i * n + j] += vi * vectors[r][j]; }
  return C;
}

/** The balanced, h-scaled state matrix S_b·h with S = [[0, I], [−A, −(C_free + Σ contacts)]] (shared by the passive and the forced stepper). */
function scaledStateMatrix(network, contacts, sampleRate) {
  if (!Number.isInteger(sampleRate) || sampleRate < 1000 || sampleRate > 384000) throw new Error('sampleRate must be an integer in 1000..384000.');
  const { n, A } = network, dim = 2 * n, h = 1 / sampleRate, C = freeDamping(network);
  for (const contact of contacts) { const Ct = contactDamping(network, contact); for (let i = 0; i < n * n; i++) C[i] += Ct[i]; }
  // Balance the state so displacement and velocity rows have similar scale (ẏ ~ ω y): x_b = [y; ẏ/ω₀] with ω₀ = √‖A‖₁.
  // That keeps ‖S h‖ near ω_max h instead of ω_max² h, so far fewer squarings and far less roundoff; Φ is mapped back.
  let aNorm = 0; for (let j = 0; j < n; j++) { let c = 0; for (let i = 0; i < n; i++) c += Math.abs(A[i][j]); aNorm = Math.max(aNorm, c); }
  const w0 = Math.sqrt(aNorm) || 1, S = new Float64Array(dim * dim);
  for (let i = 0; i < n; i++) { S[i * dim + (n + i)] = h * w0; for (let j = 0; j < n; j++) { S[(n + i) * dim + j] = -A[i][j] * h / w0; S[(n + i) * dim + (n + j)] = -C[i * n + j] * h; } }
  return { S, w0, dim, n, h };
}
const unbalance = (M, dim, n, w0) => { const out = new Float64Array(dim * dim); for (let i = 0; i < dim; i++) for (let j = 0; j < dim; j++) out[i * dim + j] = M[i * dim + j] * (i < n ? 1 : w0) / (j < n ? 1 : w0); return out; };

/** Φ = exp(S h) for S = [[0, I], [−A, −(C_free + Σ contacts)]], h = 1/sampleRate; returns { phi, n, dim: 2n, step(x), stepInto(x, out) }. */
export function stateStepper(network, { contacts = [], sampleRate } = {}) {
  const { S, w0, dim, n } = scaledStateMatrix(network, contacts, sampleRate);
  const phi = unbalance(matrixExponential(S, dim), dim, n, w0);
  /** Allocation-free: writes Φ x into out (caller-owned, must not alias x). */
  const stepInto = (x, out) => { if (out === x) throw new Error('stepInto: out must not alias x.'); for (let i = 0; i < dim; i++) { let s = 0; const row = i * dim; for (let j = 0; j < dim; j++) s += phi[row + j] * x[j]; out[i] = s; } return out; };
  const step = x => stepInto(x, new Float64Array(dim));
  return Object.freeze({ phi, n, dim, sampleRate, contacts: Object.freeze(contacts.map(c => Object.freeze({ ...c }))), step, stepInto });
}

/** Forced stepper (proposal 020 B): a force held constant over each sample on direction b (a mass-normalized velocity vector, e.g. the
 *  velocity part of a unit strike vector). Exact affine zero-order-hold evolution x ← Φ x + Γ f with Γ = ∫₀ʰ e^{Sτ} dτ · b, both from
 *  one exponential of the augmented matrix [[S h, b h], [0, 0]]. The declared input is the sample-held force, not a continuous curve. */
export function forcedStepper(network, { contacts = [], sampleRate, direction } = {}) {
  const { S, w0, dim, n } = scaledStateMatrix(network, contacts, sampleRate), h = 1 / sampleRate;
  if (!direction || direction.length !== dim) throw new Error('direction must be a state-sized vector (force enters the velocity rows).');
  for (let i = 0; i < n; i++) if (direction[i] !== 0) throw new Error('a force acts on velocity rows only; displacement rows of direction must be zero.');
  const m = dim + 1, M = new Float64Array(m * m);
  for (let i = 0; i < dim; i++) { for (let j = 0; j < dim; j++) M[i * m + j] = S[i * dim + j]; M[i * m + dim] = (i < n ? direction[i] : direction[i] / w0) * h; }   // balanced b·h
  const E = matrixExponential(M, m), phiB = new Float64Array(dim * dim), gammaB = new Float64Array(dim);
  for (let i = 0; i < dim; i++) { for (let j = 0; j < dim; j++) phiB[i * dim + j] = E[i * m + j]; gammaB[i] = E[i * m + dim]; }
  const phi = unbalance(phiB, dim, n, w0), gamma = Float64Array.from(gammaB, (g, i) => (i < n ? g : g * w0));
  const norm = Math.sqrt(direction.reduce((a, v) => a + v * v, 0));
  const stepInto = (x, f, out) => { if (out === x) throw new Error('stepInto: out must not alias x.'); for (let i = 0; i < dim; i++) { let s = gamma[i] * f; const row = i * dim; for (let j = 0; j < dim; j++) s += phi[row + j] * x[j]; out[i] = s; } return out; };
  return Object.freeze({ phi, gamma, n, dim, sampleRate, directionNorm: norm, contacts: Object.freeze(contacts.map(c => Object.freeze({ ...c }))), stepInto, step: (x, f) => stepInto(x, f, new Float64Array(dim)) });
}

/** The mass-normalized state the modal sums give at time t for strikes [{ body, u, J, time }] (bodies at rest before the first). */
export function stateAt(network, strikes, t) {
  const { n, vectors, gammas, omegaD } = network, x = new Float64Array(2 * n);
  for (const k of strikes) {
    const tau = t - k.time; if (tau < 0) continue;
    const { coeff } = network.strike(k.body, k.u, k.J);
    for (let r = 0; r < n; r++) {
      const e = coeff[r] * Math.exp(-gammas[r] * tau), s = Math.sin(omegaD[r] * tau), c = Math.cos(omegaD[r] * tau), qr = e * s, qdr = e * (omegaD[r] * c - gammas[r] * s);
      for (let i = 0; i < n; i++) { x[i] += qr * vectors[r][i]; x[n + i] += qdr * vectors[r][i]; }
    }
  }
  return x;
}

/** The impulse a strike adds to the mass-normalized velocity: Δẏ = J · φ_b(u) / √m_b on the struck body's partials. */
export function strikeImpulse(network, { body, u, J = 1 }) {
  const { n, sizes, offsets, snapshot } = network, d = new Float64Array(2 * n), w = snapshot[body].shape(u);
  for (let j = 0; j < sizes[body]; j++) d[n + offsets[body] + j] = J * w[j] / Math.sqrt(snapshot[body].mass);
  return d;
}

/** Free response from a state under the classical damping: x(τ) by modal sums, exact for τ ≥ 0 (used after a hand lifts). */
export function freeResponseFromState(network, x0) {
  const { n, vectors, gammas, omegaD } = network;
  const q0 = vectors.map(v => { let s = 0; for (let i = 0; i < n; i++) s += v[i] * x0[i]; return s; }), qd0 = vectors.map(v => { let s = 0; for (let i = 0; i < n; i++) s += v[i] * x0[n + i]; return s; });
  return tau => {
    const x = new Float64Array(2 * n);
    for (let r = 0; r < n; r++) {
      const e = Math.exp(-gammas[r] * tau), s = Math.sin(omegaD[r] * tau), c = Math.cos(omegaD[r] * tau), b = (qd0[r] + gammas[r] * q0[r]) / omegaD[r];
      const qr = e * (q0[r] * c + b * s), qdr = e * (qd0[r] * c - (omegaD[r] * q0[r] + gammas[r] * b) * s);
      for (let i = 0; i < n; i++) { x[i] += qr * vectors[r][i]; x[n + i] += qdr * vectors[r][i]; }
    }
    return x;
  };
}

/** Displacement of body b at pickup position p from a state: Σ_j φ_bj(p) y_j / √m_b. */
export function statePickup(network, x, body, p) {
  const { sizes, offsets, snapshot } = network, w = snapshot[body].shape(p); let s = 0;
  for (let j = 0; j < sizes[body]; j++) s += w[j] * x[offsets[body] + j];
  return s / Math.sqrt(snapshot[body].mass);
}

/** Mechanical energy of a state: ½ ẏᵀẏ + ½ yᵀ A y (mass-normalized), non-increasing under any non-negative damping. */
export function stateEnergy(network, x) {
  const { n, A } = network; let e = 0;
  for (let i = 0; i < n; i++) { e += 0.5 * x[n + i] * x[n + i]; for (let j = 0; j < n; j++) e += 0.5 * x[i] * A[i][j] * x[j]; }
  return e;
}
