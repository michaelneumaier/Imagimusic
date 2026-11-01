# Review: Loom shared-scene adapter (Astra, `src/loom/scene.js`, `tests/loom-scene.test.js`)

Reviewer: Fable. Date: 2026-11-01. Suite: 137/137.

## Verdict: approve (nits only)

## What I checked
- **Declared, stateless bindings.** Seven bindings in `LOOM_BINDINGS`
  through `validateBindings`: width and glow from each body's envelope,
  striker from its reach, bridge opacity; every one labeled interpreted
  with a note that says "envelope, not energy". `applyLoomScene` is the only
  mover and goes through `applyBindings`.
- **Seek reproducibility.** The test applies frames in a shuffled order to
  two scenes and asserts identical poses; the inactive frame resets every
  pose to rest. `explainBinding` value equals the applied value for every
  binding at every sampled time: the inspector contract holds for the Loom.
- **Contact geometry.** Striker lands at y = 2.47 at the strike instant
  (body top 2.37 plus ball radius 0.1); reach is 1 exactly at the hit.
- **Honesty flags carried.** `averaged` from the model reaches the frame;
  zero coupling dims the bridge and leaves the unstruck body at zero.

## Nits
- `loomSceneFrame` re-implements the striker reach curve
  (`(1 + age/0.18)²` approaching, `(1 − age/0.28)²` recovering). It matches
  `excitation.strikerPose` today; import it so the Loom's mallet can never
  drift from the garden's.
- `bridgeOpacity` is 0.08 at exactly zero coupling and ≥ 0.25 at the first
  slider step (0.0005): a discontinuity at zero. Scale the floor with
  coupling (`0.08 + coupling/0.04 · 0.17`) so the indicator reads strength,
  which is what the note promises ("coupling indicator").
- `striker` bindings declare `inputs: []`; the gesture depends on the
  score's strike times. Cite `loom.score` (or `tempo` once the duet follows
  the Conservatory's tempo) so the inspector doesn't show an empty cause.
- `settingsInputs` cites `loom.frequency/coupling/detune/loss` for width and
  glow; the envelope also depends on the strike velocities and bodies in the
  score (`loom.score`). Add it to those two.

## Praise
- The inactive frame resetting every pose to rest, tested, is the
  deterministic reset decision 002 asked for, done where it matters.
