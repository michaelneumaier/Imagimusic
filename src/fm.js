// FM tensioner (proposal 007 rev. 2, approved 2026-11-01 with corrections): digital linear FM in hertz with a
// closed-form phase, an interpreted visible mechanism (a modulator wheel stretching a carrier's tension).
// Pure, deterministic, time-indexed. No audio-rate quantity ever reaches the picture-facing state.
//
//   f(t)  = f_c + D(t)·sin(ω_m t),  D(t) = D₀·e^{−t/τ_I}  (constant index: τ_I = ∞)           instantaneous frequency, may be negative
//   φ(t)  = ω_c t + φ₀ + 2π D₀ · [ω_m − e^{−t/τ_I}(ω_m cos ω_m t + (1/τ_I) sin ω_m t)] / ((1/τ_I)² + ω_m²)
//         = ω_c t + φ₀ + I(1 − cos ω_m t)   when constant, I = D₀/f_m                         (exact integral of 2π f)
//   x(t)  = level·e^{−t/τ_A}·fade(t)·sin φ(t)
//
// Bessel reference (constant index, FM phase as above, Chowning 1973 with reflected side frequencies):
//   sin φ(t) = Σ_k J_k(I)·sin((ω_c + k ω_m) t + φ₀ + I − kπ/2),  k = −N..N
//
// Alias policy: a SCREENING HEURISTIC (Bessel-tail energy above the 0.45·sr guard, worst over a grid of indices in
// [0, I₀], reflected components folded) rejects parameter sets that would obviously alias; it is not a guarantee.
// The gate is measured, in tests/fm.test.js: (a) predicted-component magnitudes at 48 kHz vs decimated 192 kHz
// (−122 dB re peak at carrier 1200 / ratio 2 / index 3) and (b) a FULL-PASSBAND time-domain residual after both
// rates pass an equivalent linear-phase lowpass at 0.4·rate with matched delay (sees folded energy between bins and
// phase errors): measured 2026-11-01, RMS re signal over the interior interval 0.05–0.55 s of a 0.6 s render (the
// 50 ms margins exclude onset and filter edges; neither the onset nor the final fade is measured), pipeline floor on a
// pure tone in brackets:
// default 220/2/3 −154 dB (−158), low f_m 220/0.01/3 −154 dB (−158), default at 44.1 kHz −154 dB (−154),
// near the screening boundary 1500/4/0.7 −87 dB (−158). Target: below −50 dB or within 6 dB of the floor.
// These are the measured cases; no input set is promised alias-free.
//
// The mechanism is always interpreted. `positiveInstantaneousFrequency` (D₀ < f_c) only says whether the carrier's
// instantaneous frequency stays positive; it does not claim physical validity.

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const bounded = (v, [lo, hi], name) => { finite(v, name); if (v < lo || v > hi) throw new Error(`${name} must be within [${lo}, ${hi}].`); return v; };

// ratio floor 0.01 (Astra, 2026-11-01): f_m = 2.2 Hz on the default carrier is a slow audible vibrato, so the study can
// walk from pitch motion into timbre with the same equations; the closed form has no small-ω_m hazard (a² + ω_m² > 0).
export const TENSIONER_BOUNDS = { carrierHz: [40, 2000], ratio: [0.01, 8], index: [0, 10], indexDecayS: [0.02, 8], ampDecayS: [0.05, 8], level: [0, 1] };
export const DEFAULT_TENSIONER = Object.freeze({ carrierHz: 220, ratio: 2, index: 3, constantIndex: false, indexDecayS: 0.8, ampDecayS: 1.5, level: 0.19, phase0: 0 });
export const NYQUIST_FRACTION = 0.45;
export const ALIAS_SCREEN_RATIO = 1e-6;       // −60 dB tail-energy screening threshold
export const FADE_SECONDS = 0.025;
export const MAX_DURATION_S = 20;
export const SILENCE_RATIO = 1e-4;            // the note ends when the amplitude envelope falls below this × level
export const MAX_VISIBLE_RATE_HZ = 8;         // same as the Loom's MAX_VISIBLE_BEAT_HZ

/** Bessel functions of the first kind J_0..J_K at x ≥ 0 by Miller's backward recurrence (stable for all k, x here). */
export function besselJ(x, K) {
  if (!Number.isFinite(x) || x < 0) throw new Error('besselJ needs x ≥ 0.');
  if (!Number.isInteger(K) || K < 0) throw new Error('besselJ needs an integer K ≥ 0.');
  const out = new Float64Array(K + 1);
  if (x === 0) { out[0] = 1; return out; }
  const start = Math.max(K + 2, Math.ceil(x) + 40) + (Math.max(K + 2, Math.ceil(x) + 40) % 2);
  let jp = 0, j = 1e-300, sum = 0;
  const tmp = new Float64Array(start + 2);
  tmp[start + 1] = 0; tmp[start] = 1e-300;
  for (let k = start; k >= 1; k--) {
    const jm = (2 * k / x) * tmp[k] - tmp[k + 1];
    tmp[k - 1] = jm;
    if (Math.abs(jm) > 1e250) for (let m = k - 1; m <= start + 1; m++) tmp[m] *= 1e-250;   // rescale to avoid overflow
  }
  sum = tmp[0]; for (let k = 2; k <= start; k += 2) sum += 2 * tmp[k];
  for (let k = 0; k <= K; k++) out[k] = tmp[k] / sum;
  void jp; void j;
  return out;
}
/** J_k for signed k. */
export const besselJk = (table, k) => (k >= 0 ? table[k] : (k % 2 === 0 ? 1 : -1) * table[-k]);

/** Internal parameters from a block (no bounds checking: the core may be used outside UI bounds for reference cases). */
export function tensionerCore(block) {
  const carrierHz = finite(block.carrierHz, 'carrierHz'), ratio = finite(block.ratio, 'ratio'), index = finite(block.index, 'index');
  const constantIndex = !!block.constantIndex, tauI = constantIndex ? Infinity : finite(block.indexDecayS, 'indexDecayS');
  const tauA = finite(block.ampDecayS, 'ampDecayS'), level = finite(block.level ?? 0.19, 'level'), phase0 = finite(block.phase0 ?? 0, 'phase0');
  if (carrierHz <= 0 || ratio <= 0 || index < 0 || tauA <= 0 || (!constantIndex && tauI <= 0) || level < 0) throw new Error('tensioner parameters out of domain.');
  const modulatorHz = ratio * carrierHz, deviationHz = index * modulatorHz;
  return { carrierHz, ratio, index, constantIndex, tauI, tauA, level, phase0, modulatorHz, deviationHz, positiveInstantaneousFrequency: deviationHz < carrierHz };
}

export function tensionerPhase(t, tn) {
  finite(t, 't');
  const wc = 2 * Math.PI * tn.carrierHz, wm = 2 * Math.PI * tn.modulatorHz;
  if (tn.deviationHz === 0) return wc * t + tn.phase0;
  if (tn.constantIndex) return wc * t + tn.phase0 + tn.index * (1 - Math.cos(wm * t));
  const a = 1 / tn.tauI;
  const integral = (wm - Math.exp(-a * t) * (wm * Math.cos(wm * t) + a * Math.sin(wm * t))) / (a * a + wm * wm);
  return wc * t + tn.phase0 + 2 * Math.PI * tn.deviationHz * integral;
}
export const tensionerInstantaneousHz = (t, tn) => tn.carrierHz + tn.deviationHz * Math.exp(-finite(t, 't') / tn.tauI) * Math.sin(2 * Math.PI * tn.modulatorHz * t);
export const tensionerIndexAt = (t, tn) => tn.index * Math.exp(-t / tn.tauI);

/** Unfaded duration: until the amplitude envelope drops below SILENCE_RATIO × level, capped. */
export const tensionerRawDuration = tn => Math.min(MAX_DURATION_S, tn.tauA * Math.log(1 / SILENCE_RATIO));
/** Sample-aligned end: the last rendered sample sits exactly at the end and is exactly zero. */
export function tensionerEnd(tn, sampleRate) {
  finite(sampleRate, 'sampleRate'); if (sampleRate <= 0) throw new Error('sampleRate must be positive.');
  const n = Math.ceil(tensionerRawDuration(tn) * sampleRate);
  return { samples: n, endS: (n - 1) / sampleRate };
}
export const tensionerFade = (t, endS) => Math.max(0, Math.min(1, (endS - t) / FADE_SECONDS));
export const tensionerAmplitude = (t, tn, endS) => tn.level * Math.exp(-t / tn.tauA) * tensionerFade(t, endS);

/** Double-precision sample; renders store Math.fround of this. */
export function tensionerSample(t, tn, endS) {
  if (t < 0 || t > endS) return 0;
  return tensionerAmplitude(t, tn, endS) * Math.sin(tensionerPhase(t, tn));
}
export function renderTensioner(tn, sampleRate = 48000) {
  const { samples, endS } = tensionerEnd(tn, sampleRate);
  const out = new Float32Array(samples);
  for (let n = 0; n < samples; n++) out[n] = tensionerSample(n / sampleRate, tn, endS);
  return out;
}

/** Picture-facing state: envelopes and estimates only. modulatorPhase01 appears only below MAX_VISIBLE_RATE_HZ. */
export function tensionerState(t, tn, endS = Infinity) {
  finite(t, 't');
  const index = tensionerIndexAt(Math.max(0, t), tn), deviationHz = index * tn.modulatorHz;
  // Occupied-bandwidth ESTIMATE (Carson, 2·(D + f_m)), meaningful only for a non-zero deviation: a pure carrier (index 0)
  // occupies no bandwidth, so the estimate is exactly 0 there instead of the misleading 2·f_m floor. For a decaying
  // index the estimate tends to that floor as D → 0 while sidebands are already negligible; it is a visual estimate,
  // never a measurement.
  const state = {
    index, deviationHz, tension01: tn.index > 0 ? index / tn.index : 0,
    positiveInstantaneousFrequency: tn.positiveInstantaneousFrequency,
    bandwidthEstimateHz: deviationHz > 0 ? 2 * (deviationHz + tn.modulatorHz) : 0,
    amplitude: t < 0 ? 0 : tensionerAmplitude(t, tn, endS),
    modulatorHz: tn.modulatorHz, carrierHz: tn.carrierHz,
  };
  if (tn.modulatorHz < MAX_VISIBLE_RATE_HZ) state.modulatorPhase01 = ((t * tn.modulatorHz) % 1 + 1) % 1;
  return state;
}

/** Reference: Bessel series with the FM phase, constant index only. Exported on purpose for tests. */
export function besselSeries(t, tn, N) {
  if (!tn.constantIndex) throw new Error('besselSeries is a constant-index reference.');
  const I = tn.index, table = besselJ(I, N), wc = 2 * Math.PI * tn.carrierHz, wm = 2 * Math.PI * tn.modulatorHz;
  let s = 0;
  for (let k = -N; k <= N; k++) s += besselJk(table, k) * Math.sin((wc + k * wm) * t + tn.phase0 + I - k * Math.PI / 2);
  return s;
}

/** Screening heuristic: worst Bessel-tail energy ratio above the guard over a grid of indices in [0, I₀], folded. */
export function aliasScreening(tn, sampleRate, steps = 16) {
  const guard = NYQUIST_FRACTION * sampleRate;
  let worst = 0, worstIndex = 0;
  for (let s = 0; s <= steps; s++) {
    const I = tn.index * s / steps, K = Math.ceil(I) + 20, table = besselJ(I, K);
    let total = 0, tail = 0;
    for (let k = -K; k <= K; k++) { const e = besselJk(table, k) ** 2; total += e; if (Math.abs(tn.carrierHz + k * tn.modulatorHz) >= guard) tail += e; }
    const ratio = tail / total;
    if (ratio > worst) { worst = ratio; worstIndex = I; }
  }
  return { tailEnergyRatio: worst, atIndex: worstIndex, accepted: worst < ALIAS_SCREEN_RATIO, guardHz: guard, heuristic: true };
}

/** UI-facing validation: bounds, serializable form (constantIndex boolean + bounded indexDecayS), alias screening. */
export function validateTensioner(block, sampleRate = 48000) {
  if (!block || typeof block !== 'object') throw new Error('tensioner block must be an object.');
  const B = TENSIONER_BOUNDS;
  const saved = {
    carrierHz: bounded(block.carrierHz, B.carrierHz, 'carrierHz'), ratio: bounded(block.ratio, B.ratio, 'ratio'), index: bounded(block.index, B.index, 'index'),
    constantIndex: !!block.constantIndex, indexDecayS: bounded(block.indexDecayS ?? DEFAULT_TENSIONER.indexDecayS, B.indexDecayS, 'indexDecayS'),
    ampDecayS: bounded(block.ampDecayS, B.ampDecayS, 'ampDecayS'), level: bounded(block.level ?? DEFAULT_TENSIONER.level, B.level, 'level'), phase0: finite(block.phase0 ?? 0, 'phase0'),
  };
  const core = tensionerCore(saved);
  const screening = aliasScreening(core, sampleRate);
  if (!screening.accepted) throw new Error(`alias screening rejects this tensioner: ${screening.tailEnergyRatio.toExponential(2)} of sideband energy (at index ${screening.atIndex.toFixed(2)}) would land at or above ${screening.guardHz} Hz (limit ${ALIAS_SCREEN_RATIO}).`);
  return { ...saved, derived: { modulatorHz: core.modulatorHz, deviationHz: core.deviationHz, positiveInstantaneousFrequency: core.positiveInstantaneousFrequency, aliasScreening: screening } };
}
