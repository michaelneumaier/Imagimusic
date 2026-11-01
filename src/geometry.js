// Geometry-derived resonators: mode frequencies, mode shapes, and decay times
// from physical dimensions and material constants. Pure math, no DOM, no audio.
//
// Contract (docs/ARCHITECTURE.md, Contract 2):
//   modesOf(geometry, { count = 5, sampleRate } = {}) -> ModeSet
//
// geometry is one of
//   { kind: 'beam',   lengthM, thicknessM, widthM, material: { E, rho, eta }, support: 'clamped-free' }
//   { kind: 'string', lengthM, tensionN, linearDensity, stiffness = 0 (EI, N·m²), eta = 1e-3 }
//
// ModeSet = {
//   kind, count,
//   freqsHz:  number[]                      ascending, one per mode kept
//   shapes:   ((x01: number) => number)[]   normalized so max |shape| over [0,1] is 1; x01 = 0 at the clamped / left end
//   decaysS:  number[]                      exponential time constant per mode (amplitude ~ exp(-t / decay))
//   weightsAt(x01) -> number[]              signed modal excitation weights for a point impulse at x01 (= shapes[n](x01))
//   dropped:  number                        modes removed by the Nyquist guard (>= 0.45 * sampleRate), if sampleRate given
//   meta:     { formula, assumptions[] }    human-readable provenance
// }
//
// Formulas and references
//   Euler–Bernoulli clamped-free (cantilever) beam, uniform rectangular section:
//     f_n = (β_n L)² / (2π L²) · sqrt(E I / (ρ A)),  I = w t³ / 12,  A = w t
//     β_n L roots of cos(βL)·cosh(βL) = -1: 1.875104, 4.694091, 7.854757, 10.995541, 14.137168, then ≈ (2n−1)π/2
//     φ_n(x) = cosh(βx) − cos(βx) − σ_n (sinh(βx) − sin(βx)),  σ_n = (cosh βL + cos βL) / (sinh βL + sin βL)
//     (Blevins, "Formulas for Natural Frequency and Mode Shape", Table 8-1; Rossing & Fletcher, "Physics of Musical Instruments", §2.)
//   Pinned–pinned string with bending stiffness (Fletcher 1964):
//     f_n = n f_0 sqrt(1 + B n²),  f_0 = (1 / 2L) sqrt(T / μ),  B = π² E I / (T L²)
//     φ_n(x) = sin(n π x / L)
//   Decay: structural loss factor η gives Q = 1/η and amplitude time constant τ_n = Q / (π f_n) = 1 / (π f_n η).
//     This is the explicit damping assumption: constant loss factor, so higher modes die faster. No air or support losses.
//
// Not implemented (rejected, not invented): free-free beams, clamped-clamped, plates, membranes, tubes.

export const BETA_L_CLAMPED_FREE = [1.875104, 4.694091, 7.854757, 10.995541, 14.137168];
export const MAX_MODES = 8;           // cosh(βL) overflows precision for higher cantilever modes; raise only with a stable shape formula
export const NYQUIST_FRACTION = 0.45; // same guard as src/model.js modesFor

// Material constants: E in Pa, rho in kg/m³, eta = structural loss factor (dimensionless).
// E and rho are textbook values. eta values are order-of-magnitude assumptions for freely ringing
// solid bars (Rossing & Fletcher list Q of 10³–10⁴ for metals, 10² for wood); tune by ear and record changes here.
export const GEOMETRY_MATERIALS = {
  steel:    { E: 200e9, rho: 7850, eta: 2e-4 },
  aluminum: { E: 69e9,  rho: 2700, eta: 1e-4 },
  bronze:   { E: 105e9, rho: 8800, eta: 3e-4 },
  glass:    { E: 70e9,  rho: 2500, eta: 1e-4 },
  spruce:   { E: 10e9,  rho: 450,  eta: 1e-2 },
};

const positive = (value, name) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a positive finite number.`);
  return value;
};
const nonNegative = (value, name, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${name} must be a non-negative finite number.`);
  return value;
};

function betaL(n) { return n < BETA_L_CLAMPED_FREE.length ? BETA_L_CLAMPED_FREE[n] : (2 * (n + 1) - 1) * Math.PI / 2; }

function cantileverShape(bl) {
  const sigma = (Math.cosh(bl) + Math.cos(bl)) / (Math.sinh(bl) + Math.sin(bl));
  const raw = x01 => { const z = bl * x01; return Math.cosh(z) - Math.cos(z) - sigma * (Math.sinh(z) - Math.sin(z)); };
  // Normalize to max |φ| = 1 over the span (sampled; the maximum is always at or near the free tip).
  let peak = 0;
  for (let i = 0; i <= 400; i++) peak = Math.max(peak, Math.abs(raw(i / 400)));
  return x01 => raw(Math.min(1, Math.max(0, x01))) / peak;
}

function beamModes(g, count) {
  const L = positive(g.lengthM, 'lengthM'), t = positive(g.thicknessM, 'thicknessM'), w = positive(g.widthM, 'widthM');
  if (!g.material) throw new Error('beam needs material { E, rho, eta }.');
  const E = positive(g.material.E, 'material.E'), rho = positive(g.material.rho, 'material.rho'), eta = positive(g.material.eta, 'material.eta');
  if (g.support !== 'clamped-free') throw new Error(`beam support '${g.support}' is not implemented; only 'clamped-free' is.`);
  const I = w * t ** 3 / 12, A = w * t;
  const stiffnessTerm = Math.sqrt(E * I / (rho * A));
  const modes = [];
  for (let n = 0; n < count; n++) {
    const bl = betaL(n);
    const f = bl ** 2 / (2 * Math.PI * L * L) * stiffnessTerm;
    modes.push({ f, shape: cantileverShape(bl), decay: 1 / (Math.PI * f * eta) });
  }
  return { modes, formula: 'Euler–Bernoulli clamped-free beam: f_n = (β_n L)²/(2πL²)·√(EI/ρA)', assumptions: [
    'uniform rectangular section, small deflections, no shear or rotary inertia (thin beam: L/t ≳ 10)',
    `constant structural loss factor η = ${eta}: τ_n = 1/(π f_n η), higher modes decay faster`,
    'no air loading, no support losses, no nonlinearity',
  ] };
}

function stringModes(g, count) {
  const L = positive(g.lengthM, 'lengthM'), T = positive(g.tensionN, 'tensionN'), mu = positive(g.linearDensity, 'linearDensity');
  const EI = nonNegative(g.stiffness, 'stiffness', 0), eta = nonNegative(g.eta, 'eta', 1e-3) || 1e-3;
  const f0 = Math.sqrt(T / mu) / (2 * L);
  const B = Math.PI ** 2 * EI / (T * L * L);
  const modes = [];
  for (let n = 1; n <= count; n++) {
    const f = n * f0 * Math.sqrt(1 + B * n * n);
    modes.push({ f, shape: x01 => Math.sin(n * Math.PI * Math.min(1, Math.max(0, x01))), decay: 1 / (Math.PI * f * eta) });
  }
  return { modes, formula: 'Pinned–pinned stiff string: f_n = n f₀ √(1 + B n²), f₀ = √(T/μ)/(2L), B = π²EI/(T L²)', assumptions: [
    'ideal pinned ends, linear, no coupling to a body',
    `constant loss factor η = ${eta}: τ_n = 1/(π f_n η)`,
    EI === 0 ? 'no bending stiffness: exactly harmonic' : `bending stiffness EI = ${EI} N·m² (inharmonicity B = ${B.toExponential(2)})`,
  ] };
}

export function modesOf(geometry, { count = 5, sampleRate } = {}) {
  if (!geometry || typeof geometry !== 'object') throw new Error('geometry must be an object.');
  if (!Number.isInteger(count) || count < 1 || count > MAX_MODES) throw new Error(`count must be an integer in 1..${MAX_MODES}.`);
  if (sampleRate !== undefined) positive(sampleRate, 'sampleRate');
  let built;
  if (geometry.kind === 'beam') built = beamModes(geometry, count);
  else if (geometry.kind === 'string') built = stringModes(geometry, count);
  else throw new Error(`geometry kind '${geometry.kind}' is not implemented (beam, string).`);
  const kept = sampleRate ? built.modes.filter(m => m.f < sampleRate * NYQUIST_FRACTION) : built.modes;
  const shapes = kept.map(m => m.shape);
  return {
    kind: geometry.kind,
    count: kept.length,
    freqsHz: kept.map(m => m.f),
    shapes,
    decaysS: kept.map(m => m.decay),
    weightsAt: x01 => shapes.map(shape => shape(x01)),
    dropped: built.modes.length - kept.length,
    meta: { formula: built.formula, assumptions: built.assumptions },
  };
}

// Convenience: a ModeSet rendered in the shape src/model.js `modesFor` returns, so the garden can
// play a geometry voice without knowing where the modes came from. amplitude scaling mirrors model.js.
export function toModelModes(modeSet, { strikeX01 = 0.85, level = 0.19 } = {}) {
  const weights = modeSet.weightsAt(strikeX01);
  return modeSet.freqsHz.map((frequency, i) => ({
    frequency,
    amplitude: level * Math.abs(weights[i]) / (1 + i * 0.35),
    decay: modeSet.decaysS[i],
  }));
}
