// The Grove (proposal 014b): a seeded family of three connected bodies whose anatomy follows the sound model.
// composeGrove(seed) → a canonical grove; groveSystem(grove) → the coupled network (src/coupling.js); describeGrove measures
// what a grove actually does (mode split, participation, each body's first swell after a touch elsewhere, ring); and
// composeGroveGreeting composes the short authored introduction (solo → neighbor → third body → shared → silence).
// What follows the model: link existence, mass (→ volume) and tuning (→ a disclosed visual property). Everything else on
// the page (frame, suspension, spacing, shell form, materials, scale) is design. No "two bridges away" promise is made;
// each curated seed's measured behavior is stated in the proposal.

import { coupledNetwork, networkStrikeResponse, networkPickupScale } from '../coupling.js';
import { NOTES, frequency } from '../model.js';

export const GROVE_VERSION = 1;
export const GROVE_BODIES = 3;
export const GROVE_TOPOLOGIES = Object.freeze(['chain', 'triangle']);
export const GROVE_BOUNDS = Object.freeze({ hz: [80, 600], mass: [0.01, 0.04], coupling: [0.001, 0.04], loss: [0.2, 2], clusterCents: 40 });
export const GROVE_SEEDS = Object.freeze([3, 7, 11]);                  // curated after measurement (see proposal 014 and tests)
export const GROVE_SWELL_GRID_SECONDS = 0.002;

// Deterministic 32-bit generator (mulberry32) so a seed is an anatomy, forever.
const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const finite = (v, name) => { if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${name} must be a finite number.`); return v; };
const within = (v, [lo, hi], name) => { finite(v, name); if (v < lo || v > hi) throw new Error(`${name} must be within ${lo}..${hi}.`); return v; };
const keysExactly = (obj, keys, what) => { if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw new Error(`${what} must be an object.`); for (const k of Object.keys(obj)) if (!keys.includes(k)) throw new Error(`${what}: unsupported field "${k}".`); for (const k of keys) if (!(k in obj)) throw new Error(`${what}: missing field "${k}".`); };
const round = (v, places) => Number(v.toFixed(places));

/** Compose a grove from a seed. Deterministic. Three bodies, a chain or a triangle, a near-resonant tuning cluster. */
export function composeGrove({ seed }) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new Error('seed must be an integer in 0..4294967295.');
  const r = rng(seed);
  const topology = GROVE_TOPOLOGIES[Math.floor(r() * GROVE_TOPOLOGIES.length)];
  const baseMidi = NOTES[Math.floor(r() * 5)];                        // the garden's lower five notes: C3 E♭3 G3 B♭3 C4
  const baseHz = frequency(baseMidi);
  const bodies = Array.from({ length: GROVE_BODIES }, (_, id) => {
    const cents = id === 0 ? 0 : round((r() * 2 - 1) * GROVE_BOUNDS.clusterCents, 1);   // body 0 sits on the base; the others within ±40 cents
    return { id, hz: round(baseHz * 2 ** (cents / 1200), 3), cents, mass: round(GROVE_BOUNDS.mass[0] + r() * (GROVE_BOUNDS.mass[1] - GROVE_BOUNDS.mass[0]), 4) };
  });
  const pairs = topology === 'chain' ? [[0, 1], [1, 2]] : [[0, 1], [1, 2], [0, 2]];
  const bridges = pairs.map(([a, b]) => ({ a, b, coupling: round(0.002 + r() * 0.012, 4) }));
  const loss = round(0.35 + r() * 0.35, 3);                           // ring 8/loss ≤ 22.9 s, capped at 20 by the model
  const layout = topology === 'chain'
    ? [{ x: -0.8, z: 0.1 }, { x: 0, z: -0.1 }, { x: 0.8, z: 0.1 }]
    : [90, 210, 330].map(deg => ({ x: round(0.75 * Math.cos(deg * Math.PI / 180), 4), z: round(0.75 * Math.sin(deg * Math.PI / 180), 4) }));
  return validateGrove({ version: GROVE_VERSION, seed, topology, cluster: { baseMidi, baseHz: round(baseHz, 3) }, bodies, bridges, loss, layout });
}

/** Strict validation; returns the grove. */
export function validateGrove(g) {
  keysExactly(g, ['version', 'seed', 'topology', 'cluster', 'bodies', 'bridges', 'loss', 'layout'], 'Grove');
  if (g.version !== GROVE_VERSION) throw new Error(`Grove version must be ${GROVE_VERSION}.`);
  if (!Number.isInteger(g.seed) || g.seed < 0 || g.seed > 4294967295) throw new Error('seed out of range.');
  if (!GROVE_TOPOLOGIES.includes(g.topology)) throw new Error('unknown topology.');
  keysExactly(g.cluster, ['baseMidi', 'baseHz'], 'cluster'); if (!NOTES.includes(g.cluster.baseMidi)) throw new Error('cluster base must be one of the garden notes.');
  if (!Array.isArray(g.bodies) || g.bodies.length !== GROVE_BODIES) throw new Error(`exactly ${GROVE_BODIES} bodies.`);
  g.bodies.forEach((b, i) => { keysExactly(b, ['id', 'hz', 'cents', 'mass'], `body ${i}`); if (b.id !== i) throw new Error(`body ${i}: id must equal its index.`); within(b.hz, GROVE_BOUNDS.hz, `body ${i}.hz`); within(b.mass, GROVE_BOUNDS.mass, `body ${i}.mass`); within(b.cents, [-GROVE_BOUNDS.clusterCents, GROVE_BOUNDS.clusterCents], `body ${i}.cents`); if (Math.abs(b.hz - g.cluster.baseHz * 2 ** (b.cents / 1200)) > 0.01) throw new Error(`body ${i}: hz does not follow from the cluster base and cents.`); });
  if (g.bodies[0].cents !== 0) throw new Error('body 0 sits on the cluster base.');
  const expected = (g.topology === 'chain' ? [[0, 1], [1, 2]] : [[0, 1], [1, 2], [0, 2]]).map(p => p.join('-'));
  if (!Array.isArray(g.bridges) || g.bridges.map(b => `${b.a}-${b.b}`).join() !== expected.join()) throw new Error('bridges must match the topology exactly.');
  g.bridges.forEach((b, i) => { keysExactly(b, ['a', 'b', 'coupling'], `bridge ${i}`); within(b.coupling, GROVE_BOUNDS.coupling, `bridge ${i}.coupling`); });
  within(g.loss, GROVE_BOUNDS.loss, 'loss');
  if (!Array.isArray(g.layout) || g.layout.length !== GROVE_BODIES) throw new Error('layout must give one position per body.');
  g.layout.forEach((p, i) => { keysExactly(p, ['x', 'z'], `layout ${i}`); within(p.x, [-1, 1], `layout ${i}.x`); within(p.z, [-1, 1], `layout ${i}.z`); });
  groveSystem(g);                                                      // the model's own bounds (underdamped, finite)
  return g;
}

/** Deterministic canonical form (sorted keys, array order kept). Validates first. */
export function canonicalGrove(g) {
  const sort = v => Array.isArray(v) ? v.map(sort) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sort(v[k])])) : v;
  return JSON.stringify(sort(validateGrove(g)));
}

/** The grove's coupled network. Bridge stiffness kc = coupling · m_a · ω_a² (the Loom's convention, with the bridge's first body). */
export function groveSystem(g) {
  return coupledNetwork({ masses: g.bodies.map(b => b.mass), frequencies: g.bodies.map(b => b.hz), edges: g.bridges.map(b => ({ a: b.a, b: b.b, kc: b.coupling * g.bodies[b.a].mass * (2 * Math.PI * g.bodies[b.a].hz) ** 2 })), gamma: g.loss });
}

/** Ring length the Loom uses: min(20, 8/loss) seconds. */
export const groveRingSeconds = g => Math.min(20, 8 / g.loss);

/** Drawn envelope of each body for a unit strike on `body` at t = 0: |Σ_j a_ij e^{−γt} e^{i·2π(f_j − f_0)t}| with signed modal
 *  amplitudes (the Loom's envelope convention; the visible beat is the mode split, not audio-rate motion). */
export function groveEnvelope(system, response, t) {
  const base = system.normalFreqsHz[0];
  return Array.from({ length: system.n }, (_, i) => { let re = 0, im = 0; for (const m of response.bodyModes(i)) { const angle = 2 * Math.PI * (m.frequency - base) * t, amp = m.amplitude * Math.exp(-Math.max(0, t) / m.decay); re += amp * Math.cos(angle); im += amp * Math.sin(angle); } return Math.hypot(re, im); });
}

/** Measured facts about a grove: nothing asserted by hand. */
export function describeGrove(g) {
  const system = groveSystem(g), scale = networkPickupScale(system), ring = groveRingSeconds(g);
  const swells = [];                                                   // for a unit strike on each body: every other body's first local envelope maximum
  for (let struck = 0; struck < system.n; struck++) {
    const r = networkStrikeResponse(system, system.m.map((_, i) => (i === struck ? 1 : 0)));
    let prev = groveEnvelope(system, r, 0); const found = Array.from({ length: system.n }, () => null), own = { level: prev[struck] };
    for (let t = GROVE_SWELL_GRID_SECONDS; t <= ring; t += GROVE_SWELL_GRID_SECONDS) {
      const cur = groveEnvelope(system, r, t);
      for (let i = 0; i < system.n; i++) if (i !== struck && !found[i] && cur[i] < prev[i]) found[i] = { seconds: round(t - GROVE_SWELL_GRID_SECONDS, 3), level: prev[i] };
      if (found.every((f, i) => i === struck || f)) break;
      prev = cur;
    }
    own.level = Math.max(own.level, groveEnvelope(system, r, GROVE_SWELL_GRID_SECONDS)[struck]);
    for (let i = 0; i < system.n; i++) if (i !== struck) swells.push({ struck, body: i, swellSeconds: found[i]?.seconds ?? null, ratio: found[i] ? round(found[i].level / own.level, 4) : 0 });
  }
  const participation = networkStrikeResponse(system, system.m.map(() => 0)).participation;   // |v_j[i]|² does not depend on the impulse
  return { seed: g.seed, topology: g.topology, normalFreqsHz: system.normalFreqsHz.map(f => round(f, 3)), modeSplitHz: round(system.normalFreqsHz.at(-1) - system.normalFreqsHz[0], 3), participation: participation.map(p => p.map(x => round(x, 6))), swells, ringSeconds: round(ring, 3), pickupScale: scale, eigen: system.eigen, metric: 'drawn displacement envelopes and modal participation; not energy' };
}

// ---- the greeting: an authored introduction to one grove ----
export const GREETING_BOUNDS = Object.freeze({ minSeconds: 15, maxSeconds: 35 });
const ROLES = Object.freeze({ solo: 0.7, neighbor: 0.55, third: 0.55, shared: 0.6 });

/** The body adjacent to body 0 with the stiffest bridge (the strongest neighbor), and the remaining body. */
export function groveNeighbors(g) {
  const adjacent = g.bridges.filter(b => b.a === 0 || b.b === 0).sort((p, q) => q.coupling - p.coupling).map(b => (b.a === 0 ? b.b : b.a));
  const neighbor = adjacent[0], third = [1, 2].find(i => i !== neighbor);
  return { neighbor, third, thirdIsAdjacent: adjacent.includes(third) };
}

/** Solo (body 0 alone) → the neighbor answers → the third body arrives late → one shared touch → silence. Beats at `tempo`. */
export function composeGroveGreeting(g, { tempo = 72, lead = 0.35 } = {}) {
  validateGrove(g);
  const { neighbor, third } = groveNeighbors(g);
  const s = (id, beat, body, role) => ({ id, beat, body, velocity: ROLES[role], role });
  const strikes = [
    s('solo:1', 0, 0, 'solo'), s('solo:2', 2.5, 0, 'solo'),
    s('neighbor:1', 5.5, neighbor, 'neighbor'), s('neighbor:2', 7, 0, 'solo'), s('neighbor:3', 8.5, neighbor, 'neighbor'),
    s('third:1', 11.5, third, 'third'), s('third:2', 13, 0, 'solo'), s('third:3', 14, neighbor, 'neighbor'), s('third:4', 14.5, third, 'third'),
    s('shared:1', 17, 0, 'shared'), s('shared:2', 17, neighbor, 'shared'), s('shared:3', 17, third, 'shared'),
  ];
  const ringBeats = Math.ceil(groveRingSeconds(g) * tempo / 60);
  return validateGroveGreeting({
    version: 1, seed: g.seed, tempo, lead, neighbor, third,
    sections: [{ id: 'solo', beats: [0, 5] }, { id: 'neighbor', beats: [5, 11] }, { id: 'third', beats: [11, 17] }, { id: 'shared', beats: [17, 18] }, { id: 'silence', beats: [18, 18 + ringBeats] }],
    strikes,
  }, g);
}
export const greetingBeatSeconds = (greeting, beat) => greeting.lead + beat * 60 / greeting.tempo;
export function greetingDuration(greeting, g) { return greetingBeatSeconds(greeting, Math.max(...greeting.strikes.map(k => k.beat))) + groveRingSeconds(g); }
/** The network's strike list in seconds: [{ time, body, velocity }], the page's and the render's input. */
export const greetingStrikes = greeting => greeting.strikes.map(k => ({ time: greetingBeatSeconds(greeting, k.beat), body: k.body, velocity: k.velocity }));

/** Validate the greeting against its grove; the promise (solo on body 0 only; neighbor before third; shared touch on all; nothing in the silence; 15–35 s) is checked. */
export function validateGroveGreeting(greeting, g) {
  keysExactly(greeting, ['version', 'seed', 'tempo', 'lead', 'neighbor', 'third', 'sections', 'strikes'], 'GroveGreeting');
  if (greeting.version !== 1 || greeting.seed !== g.seed) throw new Error('greeting must belong to this grove.');
  if (!Number.isInteger(greeting.tempo) || greeting.tempo < 40 || greeting.tempo > 160) throw new Error('tempo must be an integer in 40..160.');
  within(greeting.lead, [0, 5], 'lead');
  const { neighbor, third } = groveNeighbors(g);
  if (greeting.neighbor !== neighbor || greeting.third !== third) throw new Error('neighbor and third must follow the grove\'s bridges.');
  let cursor = 0; const ids = ['solo', 'neighbor', 'third', 'shared', 'silence'];
  if (!Array.isArray(greeting.sections) || greeting.sections.map(s => s.id).join() !== ids.join()) throw new Error('sections must be solo, neighbor, third, shared, silence.');
  for (const s of greeting.sections) { keysExactly(s, ['id', 'beats'], `section ${s.id}`); if (!Array.isArray(s.beats) || s.beats.length !== 2 || s.beats[0] !== cursor || !(finite(s.beats[1], 'end') > cursor)) throw new Error(`section ${s.id}: beats must be exactly [start, end), contiguous.`); cursor = s.beats[1]; }
  const section = beat => greeting.sections.find(s => beat >= s.beats[0] && beat < s.beats[1]);
  const seen = new Set(); let last = -Infinity;
  for (const k of greeting.strikes) {
    keysExactly(k, ['id', 'beat', 'body', 'velocity', 'role'], `strike ${k.id}`);
    if (typeof k.id !== 'string' || seen.has(k.id)) throw new Error('strike ids must be unique strings.'); seen.add(k.id);
    if (!(finite(k.beat, 'beat') >= 0) || k.beat < last) throw new Error('strikes must be sorted by beat.'); last = k.beat;
    if (!Number.isInteger(k.body) || k.body < 0 || k.body >= GROVE_BODIES) throw new Error('body out of range.');
    if (!(finite(k.velocity, 'velocity') > 0 && k.velocity <= 1) || !Object.hasOwn(ROLES, k.role)) throw new Error('velocity in (0, 1] and a known role.');
    const sec = section(k.beat); if (!sec) throw new Error(`strike ${k.id} outside the sections.`);
    if (sec.id === 'solo' && k.body !== 0) throw new Error('the solo touches body 0 only.');
    if (sec.id === 'silence') throw new Error('nothing is touched in the silence.');
  }
  const firstNeighbor = greeting.strikes.find(k => k.body === neighbor), firstThird = greeting.strikes.find(k => k.body === third);
  if (!firstNeighbor || !firstThird || !(firstThird.beat > firstNeighbor.beat)) throw new Error('the neighbor answers before the third body arrives.');
  const sharedBeat = greeting.sections[3].beats[0], shared = greeting.strikes.filter(k => k.beat === sharedBeat);
  if (new Set(shared.map(k => k.body)).size !== GROVE_BODIES) throw new Error('the shared touch strikes all three bodies at once.');
  const d = greetingDuration(greeting, g);
  if (d < GREETING_BOUNDS.minSeconds || d > GREETING_BOUNDS.maxSeconds) throw new Error(`greeting lasts ${d.toFixed(1)} s; bound is ${GREETING_BOUNDS.minSeconds}..${GREETING_BOUNDS.maxSeconds} s.`);
  return greeting;
}
