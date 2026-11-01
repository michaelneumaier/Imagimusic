// Call and answer (proposal 013a): three model readings for one playable gesture on the coupled Loom, all taken from the
// same solution the stage draws (createLoomPerformance + loomPerformanceFrame). Nothing here is energy; every number is a
// displacement-envelope quantity or a bound on one, and is named as such (Astra's 013a corrections, 2026-11-01).
//   answerPeak(settings, body)                 the UNSTRUCK body's first envelope maximum after a unit strike: a swell, not an arrival
//   stillnessBound(settings, strikes, t)       a conservative upper bound on both bodies' envelopes from now on, and when it falls below a threshold
//   meeting(settings, strikes, newStrike)      what a new strike does to its own body's envelope: grows / softens / unchanged / first

import { createLoomPerformance, loomPerformanceFrame } from '../loom/performance.js';

export const ANSWER_SAMPLE_SECONDS = 0.002;          // grid for locating the swell; stated resolution of `seconds`
export const DEFAULT_STILL_FRACTION = 0.01;          // −40 dB re the unit-strike bound at the moment of striking
export const DEFAULT_MEETING = Object.freeze({ windowSeconds: 0.05, tolerance: 0.05, firstBelow: 1e-3 });

const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const checkStrikes = strikes => {
  if (!Array.isArray(strikes) || strikes.length > 256) throw new Error('strikes must be an array of at most 256.');
  for (const [i, s] of strikes.entries()) { if (!s || typeof s !== 'object') throw new Error(`strike ${i} must be an object.`); if (!(finite(s.time, `strike ${i}.time`) >= 0) || (s.body !== 0 && s.body !== 1) || !(finite(s.velocity, `strike ${i}.velocity`) > 0 && s.velocity <= 1)) throw new Error(`strike ${i}: time ≥ 0, body 0|1, velocity in (0, 1].`); }
  return strikes;
};

/** Pure, for a unit strike at t = 0 on `body`: the other body's first local envelope maximum (its first swell), the time of the
 *  struck body's own first maximum, and their ratio. Found on a 2 ms grid up to the ring length; a model reading, not a claim
 *  about when sound "arrives" (the coupled response begins immediately). */
export function answerPeak(settings, body = 0) {
  if (body !== 0 && body !== 1) throw new Error('body must be 0 or 1.');
  const passage = createLoomPerformance(settings, [{ time: 0, body, velocity: 1 }]), other = 1 - body, ring = passage.studies[body].duration;
  const env = t => loomPerformanceFrame(passage, t).envelope;
  let prev = env(0), t = ANSWER_SAMPLE_SECONDS, swell = null, own = null;
  for (; t <= ring; t += ANSWER_SAMPLE_SECONDS) {
    const cur = env(t);
    if (!own && cur[body] < prev[body]) own = { seconds: t - ANSWER_SAMPLE_SECONDS, level: prev[body] };
    if (!swell && cur[other] < prev[other]) swell = { seconds: t - ANSWER_SAMPLE_SECONDS, level: prev[other] };
    if (own && swell) break;
    prev = cur;
  }
  if (!swell) swell = { seconds: null, level: 0 };
  if (!own) own = { seconds: null, level: Math.max(...[0, ANSWER_SAMPLE_SECONDS].map(s => env(s)[body])) };
  return { body, other, swellSeconds: swell.seconds, swellLevel: swell.level, ownPeakSeconds: own.seconds, ownPeakLevel: own.level, ratio: own.level > 0 ? swell.level / own.level : 0, gridSeconds: ANSWER_SAMPLE_SECONDS, metric: 'displacement envelope (the quantity the stage draws); not energy' };
}

// A per-strike bound on a pickup body's envelope: velocity × Σ_modes |amplitude| × exp(−(t − time)/decay) for t ≥ time (triangle inequality
// over the coherent modal sum), scaled by the passage's pickupScale as the drawn envelope is. Monotone decreasing after the strike.
const strikeBound = (passage, strike, pickupBody, t) => t < strike.time ? 0 : strike.velocity * passage.studies[strike.body].modes[pickupBody].reduce((sum, m) => sum + Math.abs(m.amplitude) * Math.exp(-(t - strike.time) / m.decay), 0);

/** Conservative: an upper bound on both bodies' envelopes at every t' ≥ t (sum of per-strike bounds, each ≥ the actual coherent envelope),
 *  and the first time at or after t when that bound is below `fraction` of a unit strike's own bound at its instant. Returns a bound and a
 *  time; never an energy. `stillAt` is null when the bound is not below threshold within `horizonSeconds`. */
export function stillnessBound(settings, strikes, t, { fraction = DEFAULT_STILL_FRACTION, horizonSeconds = 60 } = {}) {
  checkStrikes(strikes); finite(t, 't');
  if (!(fraction > 0 && fraction < 1)) throw new Error('fraction must be within (0, 1).');
  const reference = createLoomPerformance(settings, [{ time: 0, body: 0, velocity: 1 }]);
  const referenceLevel = Math.max(...[0, 1].map(p => strikeBound(reference, { time: 0, body: 0, velocity: 1 }, p, 0))), threshold = fraction * referenceLevel;
  if (!strikes.length) return { bound: 0, threshold, referenceLevel, stillAt: t, metric: 'upper bound on the displacement envelope (sum of decaying modal magnitudes); not the actual envelope, not energy' };
  const passage = createLoomPerformance(settings, strikes);
  const bound = tt => Math.max(...[0, 1].map(p => strikes.reduce((sum, s) => sum + strikeBound(passage, s, p, tt), 0)));
  const last = Math.max(...strikes.map(s => s.time)), now = Math.max(t, last);   // before the last strike the bound is not monotone; search from there
  let stillAt = null;
  if (bound(now) < threshold) stillAt = now;
  else if (bound(now + horizonSeconds) < threshold) { let lo = now, hi = now + horizonSeconds; for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (bound(mid) < threshold) hi = mid; else lo = mid; } stillAt = hi; }
  return { bound: bound(t), threshold, referenceLevel, stillAt, metric: 'upper bound on the displacement envelope (sum of decaying modal magnitudes); not the actual envelope, not energy' };
}

/** What a new strike does to ITS OWN body's drawn envelope: the envelope just before the strike vs its maximum within a short window after.
 *  'first' when the body was (near) silent; 'grows' / 'softens' beyond the tolerance; 'unchanged' within it. A per-body displacement reading:
 *  one body softening says nothing about the total, and the function makes no energy claim. */
export function meeting(settings, strikes, newStrike, { windowSeconds = DEFAULT_MEETING.windowSeconds, tolerance = DEFAULT_MEETING.tolerance, firstBelow = DEFAULT_MEETING.firstBelow } = {}) {
  checkStrikes(strikes); checkStrikes([newStrike]);
  if (strikes.some(s => s.time > newStrike.time)) throw new Error('the new strike must not precede an existing strike.');
  const reference = createLoomPerformance(settings, [{ time: 0, body: 0, velocity: 1 }]);
  const unit = Math.max(...[0, 1].map(p => strikeBound(reference, { time: 0, body: 0, velocity: 1 }, p, 0)));
  const body = newStrike.body;
  const before = strikes.length ? loomPerformanceFrame(createLoomPerformance(settings, strikes), Math.max(0, newStrike.time - 1e-6)).envelope[body] : 0;
  const after = createLoomPerformance(settings, [...strikes, newStrike]);
  let peak = 0; for (let dt = 0; dt <= windowSeconds; dt += ANSWER_SAMPLE_SECONDS) peak = Math.max(peak, loomPerformanceFrame(after, newStrike.time + dt).envelope[body]);
  const ratio = before > 0 ? peak / before : Infinity;
  const relation = before < firstBelow * unit ? 'first' : ratio > 1 + tolerance ? 'grows' : ratio < 1 - tolerance ? 'softens' : 'unchanged';
  return { body, relation, before, after: peak, ratio: Number.isFinite(ratio) ? ratio : null, windowSeconds, tolerance, metric: 'this body\'s displacement envelope just before the strike vs its maximum within the window after; not energy, not the other body' };
}
