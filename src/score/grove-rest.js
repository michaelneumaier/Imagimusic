// The Rest recipe for a Grove voice (proposal 017): everything the engine needs, as plain serializable numbers, prepared
// off the audio thread for one sample rate. Exactness claim, stated precisely: between gesture boundaries the model is linear
// and time-invariant, and Φ = exp(S h) advances it exactly at the sample instants, up to the matrix-exponential's truncation
// (Taylor to 24 terms after scaling to ‖·‖₁ ≤ 0.5) and floating-point roundoff; there is no time-stepping approximation.
import { createGroveVoice, voiceSystem, grovePans, DEFAULT_VOICE_CONFIG } from './grove-voice.js';
import { stateStepper, strikeImpulse, contactDamping } from '../coupling.js';
import { REST_RECIPE_VERSION, contactStateKey } from '../rest/engine.js';

/** Two rest strengths, viscous coefficients in N·s/m per unit shape, stated as choices, not measurements of any hand. */
export const REST_STRENGTHS = Object.freeze({ light: 12, firm: 60 });
export const REST_STRENGTH_NAMES = Object.freeze(Object.keys(REST_STRENGTHS));
export const REST_MAX_STATES = 512;

/** Enumerate every combination of (no rest | zone × strength) over the bodies; the first state is "no contact". */
export function enumerateContactStates(bodies, zones, strengths) {
  const options = [null]; for (let z = 0; z < zones; z++) for (let s = 0; s < strengths; s++) options.push({ zone: z, strength: s });
  let states = [[]]; for (let b = 0; b < bodies; b++) states = states.flatMap(prefix => options.map(o => [...prefix, o]));
  if (states.length > REST_MAX_STATES) throw new Error(`${states.length} contact states exceed ${REST_MAX_STATES}; reduce zones or strengths.`);
  return states;
}

/** Build the recipe: transition matrices per contact state, strike vectors per position × body, stereo pickup vectors, gains. */
export function createGroveRestRecipe(grove, config = DEFAULT_VOICE_CONFIG, { sampleRate = 48000, strengths = REST_STRENGTHS, zones } = {}) {
  const voice = createGroveVoice(grove, config), g = voice.grove, c = voice.config;
  const { system } = voiceSystem(g, c), pans = grovePans(g), n = system.n, dim = 2 * n, bodies = g.bodies.length;
  const restZones = zones ?? c.positions; const strengthNames = Object.keys(strengths), strengthValues = strengthNames.map(k => strengths[k]);
  for (const u of restZones) if (!(u >= 0 && u <= 1)) throw new Error('rest zones must be positions in [0, 1].');
  for (const v of strengthValues) if (!(v > 0)) throw new Error('rest strengths must be positive viscous coefficients.');
  const states = enumerateContactStates(bodies, restZones.length, strengthValues.length);
  const contactStates = states.map(perBody => {
    const contacts = perBody.map((o, body) => (o ? { body, u: restZones[o.zone], c: strengthValues[o.strength] } : null)).filter(Boolean);
    return { key: contactStateKey(perBody), contacts, phi: Array.from(stateStepper(system, { contacts, sampleRate }).phi) };
  });
  const strikeVectors = c.positions.map(u => g.bodies.map((_, body) => Array.from(strikeImpulse(system, { body, u, J: 1 }))));
  // Pickup vectors reproduce the bank's stereo mix: output_ch = pickupScale · Σ_b pans[b][ch] · displacement(b, pickupU).
  const pickupVectors = [0, 1].map(ch => { const v = new Array(dim).fill(0); g.bodies.forEach((_, b) => { const w = system.snapshot[b].shape(c.pickupU), o = system.offsets[b]; for (let j = 0; j < system.sizes[b]; j++) v[o + j] += voice.pickupScale * pans[b][ch] * w[j] / Math.sqrt(system.snapshot[b].mass); }); return v; });
  return {
    version: REST_RECIPE_VERSION, kind: 'imagimusic-grove-rest-recipe', sampleRate, n, dim, bodies, channels: 2,
    seed: g.seed, voice: c, positions: c.positions.slice(), zones: restZones.slice(), strengths: strengthNames.map((name, i) => ({ name, c: strengthValues[i] })),
    contactStates, strikeVectors, pickupVectors, outputGain: voice.outputGain, pickupScale: voice.pickupScale, ring: voice.ring, fade: voice.fade,
    stiffness: Array.from({ length: n * n }, (_, i) => system.A[Math.floor(i / n)][i % n]),
    order: 'at frame i: apply strikes due at i to velocity; select the contact state active at i ([start, end)); read pickups as output i; step to i + 1',
    exactness: 'exact linear evolution between gesture boundaries at the sample instants, up to matrix-exponential truncation and floating-point roundoff; no time-stepping approximation; classical damping as in the modal sums; viscous point contact only',
    realism: 'a rest is a viscous damper at one point of one shell with two stated coefficients; no hand mass or stiffness, no nonlinear contact, no pressure sensing; not a measurement of any real hand on any real shell',
  };
}
export { contactDamping };
