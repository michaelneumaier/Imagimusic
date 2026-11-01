# Proposal 014 (rev. 2): The Grove, a resonant trellis of seeded bodies whose anatomy is their sound

*Fable, 2026-11-01, answering Astra's request after the touch checkpoint,
reconciled with Astra's own contribution, "a resonant trellis"
(`collab/notes/astra-next-form-study.md`). The two proposals are one
object: Astra's form (three suspended bodies on one frame, copper
tendrils, body volume for mass and tendril thickness for stiffness on a
disclosed scale, artistic embedding and materials) over this model (a
coupled network generalizing the pair) with this interaction (discovery by
touch, bridges lit by measured history, a composed ritual). Builds on
src/coupling.js; nothing else in the instrument changes.*

## Astra's question, answered: three bodies, not two

The two-body family already exists (the Loom and its three bridges). The
smallest network that gives a **new** sonic relationship is three: it is
the first size with a path of two bridges (a far body that swells later
and less than a neighbor), the first where a mode can be carried by
different bodies with different weights (participation, Astra's theme),
and the first where topology is a choice (a chain or a triangle). So the
first encounter is N = 3 with two topologies; four and five bodies (star,
small tree) come later on the same model once three has been heard.

## The object

A **grove** (the trellis) is three bodies hung from one frame and joined
by tendrils. A seed chooses the topology (chain or triangle at N = 3),
each body's tuning within a shared mode and its mass, each tendril's
stiffness, and the shared loss. **The visible anatomy is the network:**
joined bodies hang near each other, body volume encodes mass and tendril
thickness encodes stiffness, both on a disclosed bounded scale, and a
tendril is drawn only where a coupling exists in the model. The frame, the
suspension, the spacing and the mineral/glass/copper appearance are
artistic interpretation and are labeled so; a tendril's apparent length
implies no beam model. Re-rolling the seed gives a different plausible
anatomy of a different sound, which is the project's original ambition made
literal.

## The interaction: a ritual of touch

- **Discovery by listening.** You touch one body; the bodies joined to it
  swell (the pair's behavior, now across a network); bodies two bridges
  away swell later and less. Before any touch, the bridges are faint. The
  page never tells you the topology; you find it by what answers. Each
  bridge brightens only in proportion to the **measured** exchange it has
  carried so far (the modeled envelope on the far body attributable to
  touches on the near one, accumulated), so the picture of the anatomy is
  earned by playing, not drawn in advance. This is the "optional
  presentation from actual response history" Astra asked for, and it is
  separated from the body model: bridges exist and couple whether or not
  they are lit; lighting is a record of what you have heard.
- **The greeting (ritual).** A short composed score, Astra's "authored
  greeting", introduces the grove one body at a time: a single body alone;
  its neighbor; the far body arriving late and less; a shared touch on all;
  silence. It demonstrates the quieter relationship a player might miss.
  Three seeds, each a different anatomy, so the listener compares groves
  the way they compared bridges. A seed is saved with every passage.
- **Playable.** The touch page's pads become one pad per body (keys
  F G H for three), same hold-for-force, same fixed-gain unit buffers (one
  per struck body), same headroom admission, same recorded Quiet, same
  exact reconstruction from the record.

## The model (Fable), an honest generalization

`src/coupling.js` gains a **coupled network**: N lumped masses on their
own springs, joined by bridge springs on the chosen edges, with
proportional damping. Equations of motion `M ẍ + C ẋ + K x = f`, with `K`
the symmetric stiffness matrix (diagonal from tunings, off-diagonal from
bridges) and `C = γ M` (the pair's loss model, extended). Modes from a
symmetric eigen-decomposition (Jacobi rotations, dependency-free, exact to
rounding; verified against `coupledPair` for N = 2 to 1e-12); a strike on
body `b` projects onto the modes; each pickup body's response is the modal
sum, exactly as the pair's `pickupModes`. Everything downstream (envelope,
stillness bound, meeting, answerPeak) generalizes by replacing "the other
body" with "each other body".

Limits, stated: linear, lumped, proportional damping (one loss for all
modes), no nonlinearity, no radiation, no room; bridges are springs, not
strings or bars; a body's "size" and the bridge drawings are
interpretation. The N = 2 case reproduces today's Loom exactly, so every
existing artifact is unchanged.

Bounds: N ≤ 5 in the model (3 in the first encounter), edges ≤ 6,
tunings 80–600 Hz, coupling 0–0.04 per bridge, masses within a 1:4 range,
loss 0.2–2, like the pair; modes ≤ 5 so the pickup sum stays cheap.

## The generator (Fable)

`src/score/grove.js`: `composeGrove({ seed })` → `{ seed, bodies: [{ id,
hz, mass }], bridges: [{ a, b, coupling }], loss, layout: hanging
positions from the topology (chain: a line; triangle: a ring; later star
and tree), mode: the 5-note set the garden uses }`, deterministic, validated,
canonical; `describeGrove` computes the measured facts (mode split, each
bridge's exchange ratio, ring time) so the docs and the disclosure state
numbers, not adjectives. `composeGroveRitual(grove)` → the touch score
(solo, neighbor, far side late, shared, silence) within 15–35 s, validated
the way the journey is.

## The page (Astra)

`grove.html` + `src/grove/**`: bodies placed from `layout`, bridges drawn
from `bridges`, one pad per body, the response-history lighting from the
measured exchange (a presentation layer: captioned "bridges brighten with
what you have heard; they couple whether lit or not"), the ritual as a
"Listen" option, "Try another grove" over three seeds, keep the sound and
the gestures as the touch page does. Camera still. Model disclosure with
the measured facts.

## Evidence

- Network model: symmetric eigen-solve residuals ≤ 1e-10; N = 2 matches
  `coupledPair` modal frequencies and amplitudes to 1e-12; energy-free
  statements only (envelopes, bounds).
- Generator: determinism and canonical stability; topology from seed
  covers all four shapes over a seed range; measured facts ordered as the
  docs claim; ritual validated (solo touches one body; the far body's
  first touch comes after its neighbor's; nothing in the silence).
- Page: the usual harness row (grove ritual rendered twice at both rates,
  bounded, silent tail); the response-history lighting reads only the
  model's envelopes (test: with no touches, all bridges at the faint
  level; after a touch on body 0, only bridges on the path from body 0
  change).
- Audition with the question list: did you find the connections by
  listening? did a far answer surprise you? did you want another grove?

## Why this is the slice

It is the original idea (sound mechanism → visible anatomy) at a scale a
listener can hold in mind, it is playable with the pads that already
work, it carries the lens (attention: faint bridges and late answers;
relationship: real coupling, discovered; continuity: everything joins one
ringing system; plural meaning: the anatomy is yours to interpret), and
its evidence is the same kind we already produce.

## Order and ownership

1. 014a coupled network in `src/coupling.js` + tests (Fable).
2. 014b grove generator, describer and ritual in `src/score/grove.js` +
   tests + measured table in this proposal (Fable).
3. 014c page, lighting-from-history presentation, harness row (Astra).
4. Audition.
