// The Rest engine: a pure state stepper over a prepared recipe (proposal 017). No imports, no DOM, no sample-rate math:
// usable unchanged in an AudioWorklet, a Worker, Node tests and the offline renderer, so every path computes the same samples.
//
// Event order at frame i (the contract offline and live paths share, so sample 0 agrees):
//   1. apply every strike due at frame i: ẏ += velocity · strikeVector[position][body]
//   2. select the contact state due at frame i (a contact [start, end) is active when start ≤ i < end)
//   3. read the pickups: output[ch][i] = outputGain · pickupVector[ch] · y
//   4. step: x ← Φ_state · x, which yields the state at frame i + 1
// A strike's own sample 0 is therefore 0 (pure velocity impulse, no displacement yet), as in the bank.
export const REST_RECIPE_VERSION = 1;

/** Key of a contact state: a fixed-length string over bodies, '-' for no contact or `${zone}${strength}` indices. */
export const contactStateKey = perBody => perBody.map(c => (c ? `${c.zone}${c.strength}` : '-')).join('|');

export function createRestEngine(recipe) {
  if (recipe?.version !== REST_RECIPE_VERSION) throw new Error('unsupported rest recipe version.');
  const { dim, n, channels } = recipe, states = new Map(recipe.contactStates.map(s => [s.key, Float64Array.from(s.phi)]));
  const strikeVectors = recipe.strikeVectors.map(row => row.map(v => Float64Array.from(v))), pickups = recipe.pickupVectors.map(v => Float64Array.from(v));
  const freeKey = recipe.contactStates[0].key;
  let x = new Float64Array(dim), phi = states.get(freeKey), key = freeKey, next = new Float64Array(dim);
  return {
    get key() { return key; },
    get state() { return Float64Array.from(x); },
    reset() { x.fill(0); phi = states.get(freeKey); key = freeKey; },
    /** Restore a state and contact key (checkpoint replay). */
    load(state, nextKey) { if (state.length !== dim) throw new Error('state has the wrong dimension.'); x.set(state); const p = states.get(nextKey); if (!p) throw new Error(`contact state ${nextKey} is not in the recipe.`); phi = p; key = nextKey; },
    /** Step 1. */
    strike(position, body, velocity) { const v = strikeVectors[position]?.[body]; if (!v || !Number.isFinite(velocity)) throw new Error('unknown strike position or body, or non-finite velocity.'); for (let i = n; i < dim; i++) x[i] += velocity * v[i]; },
    /** Step 2: select by key (see contactStateKey). Unknown keys are an error: the allowed states are finite and precomputed. */
    setContacts(nextKey) { const p = states.get(nextKey); if (!p) throw new Error(`contact state ${nextKey} is not in the recipe.`); phi = p; key = nextKey; },
    /** Step 3: the output sample for every channel at the current frame. */
    read(out = new Float64Array(channels)) { for (let ch = 0; ch < channels; ch++) { let s = 0; const v = pickups[ch]; for (let i = 0; i < n; i++) s += v[i] * x[i]; out[ch] = recipe.outputGain * s; } return out; },
    /** Step 4. */
    step() { for (let i = 0; i < dim; i++) { let s = 0; const row = i * dim; for (let j = 0; j < dim; j++) s += phi[row + j] * x[j]; next[i] = s; } const t = x; x = next; next = t; },
    /** Mechanical energy in the recipe's mass-normalized coordinates (for evidence, not sound). */
    energy() { let e = 0; for (let i = 0; i < n; i++) { e += 0.5 * x[n + i] * x[n + i]; for (let j = 0; j < n; j++) e += 0.5 * x[i] * recipe.stiffness[i * n + j] * x[j]; } return e; },
  };
}

/** Offline rendering through the engine: strikes [{ frame, position, body, velocity }], contacts [{ body, zone, strength, start, end }] (frames, [start, end)). */
export function renderRestPassage(recipe, { strikes = [], contacts = [], frames }) {
  if (!Number.isInteger(frames) || frames < 0) throw new Error('frames must be a non-negative integer.');
  const engine = createRestEngine(recipe), out = Array.from({ length: recipe.channels }, () => new Float32Array(frames)), sample = new Float64Array(recipe.channels);
  const byFrame = new Map(); for (const k of strikes) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const edges = new Set(); for (const c of contacts) { edges.add(c.start); edges.add(c.end); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  for (let i = 0; i < frames; i++) {
    const due = byFrame.get(i); if (due) for (const k of due) engine.strike(k.position, k.body, k.velocity);
    if (i === 0 || edges.has(i)) engine.setContacts(keyAt(i));
    engine.read(sample); for (let ch = 0; ch < recipe.channels; ch++) out[ch][i] = sample[ch];
    engine.step();
  }
  return out;
}
