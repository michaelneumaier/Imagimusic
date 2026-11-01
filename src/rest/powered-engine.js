// The powered engine (Astra's powered-encounter note, 2026-11-01): the Rest engine plus one declared external force direction.
// Per contact state the recipe carries Φ and Γ (exact affine zero-order hold for a sample-held force), so a contact switch at an
// integer frame changes only the operators; the state is continuous, nothing resets and no impulse is reapplied. Pure, no imports
// beyond the Rest key helper, allocation-free in the loop; usable unchanged in an AudioWorklet.
//
// Event order at frame i: (1) apply strikes due at i to velocity; (2) select the contact state active at i; (3) read pickups as output i;
// (4) step with the force f_i applied over [i, i+1): x ← Φ_state x + Γ_state f_i. The force is a function of the encounter frame only.
import { contactStateKey, parseContactKey } from './engine.js';
export const POWERED_RECIPE_VERSION = 1;

export function createPoweredEngine(recipe) {
  if (recipe?.poweredVersion !== POWERED_RECIPE_VERSION || !recipe.driver) throw new Error('not a powered recipe.');
  const { dim, n, channels } = recipe, states = new Map(recipe.contactStates.map(s => [s.key, { phi: Float64Array.from(s.phi), gamma: Float64Array.from(s.gamma) }]));
  const strikeVectors = recipe.strikeVectors.map(row => row.map(v => Float64Array.from(v))), pickups = recipe.pickupVectors.map(v => Float64Array.from(v));
  const freeKey = recipe.contactStates[0].key, fmax = Math.max(...recipe.energyFactors);
  let x = new Float64Array(dim), next = new Float64Array(dim), state = states.get(freeKey), key = freeKey;
  return {
    get key() { return key; },
    get state() { return Float64Array.from(x); },
    reset() { x.fill(0); state = states.get(freeKey); key = freeKey; },
    load(v, nextKey) { if (v.length !== dim) throw new Error('state has the wrong dimension.'); x.set(v); const s = states.get(nextKey); if (!s) throw new Error(`contact state ${nextKey} is not in the recipe.`); state = s; key = nextKey; },
    strike(position, body, velocity) { const v = strikeVectors[position]?.[body]; if (!v || !Number.isFinite(velocity)) throw new Error('unknown strike position or body, or non-finite velocity.'); for (let i = n; i < dim; i++) x[i] += velocity * v[i]; },
    setContacts(nextKey) { const s = states.get(nextKey); if (!s) throw new Error(`contact state ${nextKey} is not in the recipe.`); state = s; key = nextKey; },
    read(out = new Float64Array(channels)) { for (let ch = 0; ch < channels; ch++) { let s = 0; const v = pickups[ch]; for (let i = 0; i < n; i++) s += v[i] * x[i]; out[ch] = recipe.outputGain * s; } return out; },
    /** Step with the force f applied over the coming sample interval (0 for a passive step). */
    step(f = 0) { const { phi, gamma } = state; for (let i = 0; i < dim; i++) { let s = gamma[i] * f; const row = i * dim; for (let j = 0; j < dim; j++) s += phi[row + j] * x[j]; next[i] = s; } const t = x; x = next; next = t; },
    energy() { let e = 0; for (let i = 0; i < n; i++) { e += 0.5 * x[n + i] * x[n + i]; for (let j = 0; j < n; j++) e += 0.5 * x[i] * recipe.stiffness[i * n + j] * x[j]; } return e; },
    bound() { return recipe.outputGain * Math.sqrt(2 * this.energy()) * fmax; },
    candidateBound(position, body, velocity) { const v = strikeVectors[position]?.[body]; if (!v || !Number.isFinite(velocity)) throw new Error('unknown strike position or body, or non-finite velocity.'); let cross = 0, self = 0; for (let i = n; i < dim; i++) { const d = velocity * v[i]; cross += x[i] * d; self += d * d; } return recipe.outputGain * Math.sqrt(Math.max(0, 2 * (this.energy() + cross + 0.5 * self))) * fmax; },
  };
}

/** The declared force of an encounter at frame i: a sample-held sinusoid over [startFrame, startFrame + forcedFrames), else 0; phase from the encounter frame only. */
export const poweredForceAt = (driver, sampleRate, i) => (i >= driver.startFrame && i < driver.startFrame + driver.forcedFrames ? driver.amplitude * Math.sin(2 * Math.PI * driver.frequencyHz * (i - driver.startFrame) / sampleRate) : 0);

/** Offline rendering through the engine: strikes [{frame, position, body, velocity}], contacts [{body, zone, strength, start, end}], the driver, frames. */
export function renderPoweredPassage(recipe, { strikes = [], contacts = [], driver, frames }) {
  if (!Number.isInteger(frames) || frames < 0) throw new Error('frames must be a non-negative integer.');
  const engine = createPoweredEngine(recipe), out = Array.from({ length: recipe.channels }, () => new Float32Array(frames)), sample = new Float64Array(recipe.channels), sr = recipe.sampleRate;
  const byFrame = new Map(); for (const k of strikes) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const edges = new Set(); for (const c of contacts) { edges.add(c.start); edges.add(c.end); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  for (let i = 0; i < frames; i++) {
    const due = byFrame.get(i); if (due) for (const k of due) engine.strike(k.position, k.body, k.velocity);
    if (i === 0 || edges.has(i)) engine.setContacts(keyAt(i));
    engine.read(sample); for (let ch = 0; ch < recipe.channels; ch++) out[ch][i] = sample[ch];
    engine.step(driver ? poweredForceAt(driver, sr, i) : 0);
  }
  return out;
}
export { contactStateKey, parseContactKey };
