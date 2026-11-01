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
