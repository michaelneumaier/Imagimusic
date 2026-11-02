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
  const freeKey = recipe.contactStates[0].key, fmax = Math.max(...(recipe.energyFactors ?? [Infinity]));
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
    /** Rigorous ceiling on every future output sample while only damping acts: outputGain · √(2E) · max energy factor. */
    bound() { return recipe.outputGain * Math.sqrt(2 * this.energy()) * fmax; },
    /** The same ceiling if this strike were applied now (nothing is mutated): E' = E + ẏ·Δ + ½|Δ|². */
    candidateBound(position, body, velocity) { const v = strikeVectors[position]?.[body]; if (!v || !Number.isFinite(velocity)) throw new Error('unknown strike position or body, or non-finite velocity.'); let cross = 0, self = 0; for (let i = n; i < dim; i++) { const d = velocity * v[i]; cross += x[i] * d; self += d * d; } return recipe.outputGain * Math.sqrt(Math.max(0, 2 * (this.energy() + cross + 0.5 * self))) * fmax; },
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

/** Parse a contact key back into per-body contacts (null or { zone, strength }). */
export const parseContactKey = key => key.split('|').map(part => (part === '-' ? null : { zone: Number(part[0]), strength: Number(part.slice(1)) }));

/** The picture from a state (pure, no history): per-body low-band envelope as groveVoiceEnvelope defines it, plus the contacts in force. */
export function visualFromState(recipe, state, contactKey) {
  const { n, bodies } = recipe, v = recipe.visual; if (!v) throw new Error('recipe has no visual projection data.');
  if (!state || state.length !== recipe.dim) throw new Error('state has the wrong dimension.');
  const re = new Array(bodies).fill(0), im = new Array(bodies).fill(0);
  for (const r of v.lowBand) {
    const vec = v.modeVectors[r]; let q = 0, qd = 0; for (let i = 0; i < n; i++) { q += vec[i] * state[i]; qd += vec[i] * state[n + i]; }
    const aRe = (qd + v.gammas[r] * q) / v.omegaD[r], aIm = q;
    for (let b = 0; b < bodies; b++) { re[b] += v.pickupByMode[r][b] * aRe; im[b] += v.pickupByMode[r][b] * aIm; }
  }
  return { envelope: re.map((x, b) => Math.hypot(x, im[b])), lowBand: true, contacts: parseContactKey(contactKey), interpretation: v.interpretation };
}

/** A sequential block renderer for one part: the same trajectory and samples as renderRestPassage (strikes by frame, the contact key
 *  recomputed only at contact edges, Float32 samples), delivered in caller-sized blocks into a scratch buffer so a mixer can combine several
 *  parts without holding any part in full. With `admissionCeiling`, each strike's candidate bound is checked against it before the strike is
 *  applied, exactly as validateRestAdmission does, and a refusal throws before the block is returned. A failure is terminal: the renderer refuses
 *  every later call, because the engine state and the scratch prefix are already partly advanced. Earlier blocks and the partial scratch exist in
 *  the caller's hands; on any failure the caller must discard every block and the scratch and must not publish a completed passage. The ending
 *  fade is not applied here; a mixer applies it as renderRestRecord does (Float32 store, then × fade stored again).
 *  Blocks must be requested in order from frame 0; the renderer keeps the engine state between calls. One engine per renderer keeps the hot
 *  loop monomorphic, which is why a mixer should drive three renderers in turn rather than three engines in one loop. */
export function createRestPassageRenderer(recipe, { strikes = [], contacts = [], frames, admissionCeiling = null } = {}) {
  if (!Number.isInteger(frames) || frames < 0) throw new Error('frames must be a non-negative integer.');
  if (admissionCeiling !== null && !(Number.isFinite(admissionCeiling) && admissionCeiling > 0)) throw new Error('admissionCeiling must be null or a positive number.');
  const engine = createRestEngine(recipe), sample = new Float64Array(recipe.channels), channels = recipe.channels;
  const byFrame = new Map(); for (const k of strikes) { if (!byFrame.has(k.frame)) byFrame.set(k.frame, []); byFrame.get(k.frame).push(k); }
  const edges = new Set(); for (const c of contacts) { edges.add(c.start); edges.add(c.end); }
  const keyAt = i => contactStateKey(Array.from({ length: recipe.bodies }, (_, b) => { const c = contacts.find(c => c.body === b && c.start <= i && i < c.end); return c ? { zone: c.zone, strength: c.strength } : null; }));
  let position = 0, admitted = 0, failed = null; const bounds = [];
  return {
    get frames() { return frames; }, get position() { return position; }, get bounds() { return bounds.slice(); }, get failed() { return failed !== null; },
    /** Render frames [from, to) into out (Float32Array per channel, length ≥ to − from). `from` must equal the current position. */
    render(from, to, out) {
      if (failed) throw new Error(`renderer failed earlier (${failed.message}); discard its output.`);
      if (from !== position || !Number.isInteger(to) || to < from || to > frames) throw new Error('blocks must be rendered in order within the passage.');
      if (!Array.isArray(out) || out.length !== channels || out.some(o => !(o instanceof Float32Array) || o.length < to - from)) throw new Error('out must hold one Float32Array per channel of at least the block length.');
      try {
      for (let i = from; i < to; i++) {
        const due = byFrame.get(i);
        if (due) for (const k of due) {
          if (admissionCeiling !== null) { const bound = engine.candidateBound(k.position, k.body, k.velocity); if (!(bound <= admissionCeiling)) throw new Error(`events[${admitted}] (frame ${k.frame}) would have been rejected: bound ${bound.toFixed(4)} exceeds the admission ceiling ${admissionCeiling}.`); bounds.push(bound); }
          engine.strike(k.position, k.body, k.velocity); admitted++;
        }
        if (i === 0 || edges.has(i)) engine.setContacts(keyAt(i));
        engine.read(sample); const o = i - from; for (let ch = 0; ch < channels; ch++) out[ch][o] = sample[ch];
        engine.step();
      }
      } catch (error) { failed = error; throw error; }
      position = to; return to - from;
    },
  };
}
