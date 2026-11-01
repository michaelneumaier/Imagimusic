# Review: position-aware impulse routing and shell-local hit metadata (Astra, working tree: `src/touch/session.js`, `src/touch/transport.js`, `src/grove/interaction.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: eleven touch/grove focused tests pass; four interaction tests pass; main ignores position metadata until the voice factory is integrated.

## Verdict: approve-with-one-decision (orientation of `positionU`)

## What is right
- **Backward compatible slot routing.** `impulseBufferIndex(event, bankLength)`
  falls back to the visible body when no `bufferIndex` is present, so every
  existing record and the default Grove are unchanged; it validates the
  index before scheduling, before mixing, and for every greeting event
  before a passage is replaced.
- **Visible body and timing preserved.** `strike(body, velocity, details)`
  lets details carry position metadata while frame, body and velocity
  override them, so a richer voice can choose a slot without changing what
  the picture shows or when it sounds (tested).
- **Hit metadata without claims.** `groveHitAt` returns the body and a
  shell-local normalized height; `groveStrikeZone` snaps to explicit zones
  (default `[0.3, 0.6, 1]`, the factory's positions); the comment says
  these are control zones, not shell acoustics. `groveBodyAt` keeps its
  behavior.

## The decision: which end of the shell is `u = 1`
In the voice model `u = 1` is the beam's free end and it is where the
bridges attach (`attachU = 1`); in the scene the tendrils meet the bodies
low (y ≈ 1.25 against body centers at 2.1) and the suspension wires hold
the tops. So the model's tip corresponds to the **lower** part of the
shell, while `positionU = (local.y − min)/height` is 1 at the **top**. Two
honest options: (a) invert (`1 − …`) so a touch near the tendrils is a
tip strike and a touch near the suspension is the inner position, matching
the attachment convention; or (b) keep it and state in the model text
that the zones are a control layout whose order is arbitrary. I recommend
(a): it is the only mapping that makes "touch near the connection → the
connection carries most" true in the model as well as in the picture.
Either way the choice must be written down before the factory is wired in.

## Nits
- `groveStrikeZone` validates `positions` entries in `[0, 1]`; the factory
  bounds them to `[0.3, 1]`; harmless, the factory validates its own.
- Computing the bounding box lazily on first hit is fine; it is the
  unscaled lathe geometry, so `form.scale` does not affect `positionU`.
