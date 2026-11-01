# Proposal 014 (rev. 3): The Grove, a resonant trellis of seeded bodies whose anatomy is their sound

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
each body's tuning within a near-resonant cluster and its mass, each
tendril's stiffness, and the shared loss. **Link existence follows the
model:** a tendril is drawn only where a coupling exists; body volume
encodes mass and tendril thickness encodes stiffness on a disclosed
bounded scale; tuning maps to a disclosed visual property. **Everything
else is design:** the frame, the suspension, spacing, shell form,
materials (mineral, glass, copper) and artistic scale are the artists'
choices, labeled as interpretation, and the lumped sound-source masses and
springs are distinguished from the interpreted shell acoustics. That
distinction is what lets the form be free. Re-rolling the seed gives a
different plausible anatomy of a different sound.

## The interaction: a ritual of touch

- **Discovery by listening and looking.** You touch one body; the others
  participate through the network, each according to the modes it carries.
  Graph distance promises nothing by itself (detuning, multiple paths and
  mode shapes decide), so the generator **curates** seeds and the docs
  state exactly what each seed exhibits, measured (for example: "touching
  body A, body C's first swell comes later and smaller than B's"); nothing
  about "two bridges away" is baked into tests or captions. The real
  topology is drawn faint but visible from the start (the model's edges),
  and each body's endpoint brightens from its **actual drawn envelope**.
  A later response-history presentation may show what each body has done
  over the passage, explicitly as response history, never as flow through
  an edge or an energy attribution (a receiver's envelope cannot be
  assigned to one edge when paths overlap). No claim that playing "earns"
  the anatomy; the listener may look and discover freely.
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

`src/coupling.js` gains a **coupled network** beside the untouched
`coupledPair`: N lumped masses on their own springs, joined by bridge
springs on the chosen edges, with the pair's damping convention exactly
(`M ẍ + 2γ M ẋ + K x = 0`, amplitude decay `e^{−γt}`, damped frequencies
`√(λ − γ²)`, underdamped required), mass-normalized `A = M^{−1/2} K
M^{−1/2}` symmetric. Modes by cyclic Jacobi rotations (dependency-free);
tests check the residual `‖A V − V Λ‖ ≤ 1e-12·‖A‖` (relative to the matrix
norm) and `‖VᵀV − I‖ ≤ 1e-12`. Degenerate eigenvalues have an arbitrary
basis, sign and order, so the N = 2 comparison with `coupledPair` is on
**reconstructed displacement and velocity at sampled times** (1e-12
relative), never on raw eigenvectors; tests also cover unequal masses,
disconnected and isotropic systems, repeated eigenvalues, and symmetric
edge validation (duplicate or self edges rejected). A strike on body `b`
projects onto the modes; each pickup body's response is the modal sum,
with the pair's pickup level convention. Everything downstream (envelope,
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
Tunings are curated as near-resonant clusters (within a few tens of cents)
because wide intervals decouple bodies perceptually despite physical links;
a deliberately contrasting body is allowed when its measured participation
is reported.

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
- Page: the usual harness row (grove greeting rendered twice at both
  rates, bounded, silent tail); endpoint brightness reads only each body's
  drawn envelope (test: with no touches, all endpoints at rest and the
  topology faint; after a touch, every body's endpoint follows its own
  envelope, no edge-flow quantity anywhere).
- Audition with the question list: did you notice who answered whom? did
  an answer surprise you? did you want another grove?

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
