// Whole-cluster transposition of an intact Grove (Astra's harmonic-ensemble experiment, 2026-11-01). Pure. No schema change.
// A Grove's identity is its cents pattern, masses, couplings (fractions of each source body's own stiffness), loss, topology and layout; its
// cluster base is one of the garden notes. Transposing moves the base and recomputes every body's hz from the SAME cents, so the physical
// recipe is rebuilt at the new pitch: every bridge stiffness kc = coupling · m · (2πf)² scales with the frequency ratio squared, every modal
// frequency scales by the ratio, and the loss (decay rates in 1/s) is unchanged, so decay times in seconds stay the same while Q scales with
// frequency. This is not playback-rate transposition. Nothing here claims what the result sounds like.
import { validateGrove, canonicalGrove } from './grove.js';

/** The garden's lower five notes, as composeGrove draws them: C3, E♭3, G3, B♭3, C4. validateGrove accepts no other cluster base. */
export const GARDEN_NOTES = Object.freeze([48, 51, 55, 58, 60]);
export const noteFrequency = midi => 440 * 2 ** ((midi - 69) / 12);
const round = (v, places) => Number(v.toFixed(places));

/** The frequency ratio of a transposition between two garden notes. */
export function transpositionRatio(fromMidi, toMidi) {
  for (const m of [fromMidi, toMidi]) if (!GARDEN_NOTES.includes(m)) throw new Error('both notes must be garden notes (48, 51, 55, 58, 60).');
  return 2 ** ((toMidi - fromMidi) / 12);
}

/** The same Grove with its whole cluster moved to `baseMidi`. Same seed, topology, cents, masses, couplings, loss and layout; hz recomputed
 *  from base and cents exactly as composeGrove does, so transposing back returns the original canonically. Returns a validated new object. */
export function retuneGroveCluster(grove, baseMidi) {
  const g = validateGrove(grove);
  if (!GARDEN_NOTES.includes(baseMidi)) throw new Error('baseMidi must be a garden note (48, 51, 55, 58, 60).');
  const baseHz = noteFrequency(baseMidi);
  const bodies = g.bodies.map(b => ({ id: b.id, hz: round(baseHz * 2 ** (b.cents / 1200), 3), cents: b.cents, mass: b.mass }));
  return validateGrove({ version: g.version, seed: g.seed, topology: g.topology, cluster: { baseMidi, baseHz: round(baseHz, 3) }, bodies, bridges: g.bridges.map(e => ({ ...e })), loss: g.loss, layout: g.layout.map(p => ({ ...p })) });
}

/** Alias kept for the proposal's wording. */
export const transposeGrove = retuneGroveCluster;

/** What a transposition keeps and what it changes, as facts for a report. */
export function describeTransposition(source, target) {
  const a = validateGrove(source), b = validateGrove(target);
  if (canonicalGrove(retuneGroveCluster(a, b.cluster.baseMidi)) !== canonicalGrove(b)) throw new Error('target is not a whole-cluster transposition of source.');
  const ratio = transpositionRatio(a.cluster.baseMidi, b.cluster.baseMidi);
  return { seed: a.seed, fromMidi: a.cluster.baseMidi, toMidi: b.cluster.baseMidi, ratio: +ratio.toFixed(6), semitones: b.cluster.baseMidi - a.cluster.baseMidi,
    kept: 'cents pattern, masses, coupling fractions, loss, topology, layout', changed: `every body frequency ×${ratio.toFixed(4)}; every bridge stiffness ×${(ratio * ratio).toFixed(4)}; modal frequencies and beat rates ×${ratio.toFixed(4)}; decay times unchanged` };
}
