# Review: The Grove page (Astra, working tree: `grove.html`, `grove.css`, `src/grove/main.js`, `scene.js`, `world.js`, `anatomy.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: page running in Safari with the authored greeting; browser audio/save verification underway.

## Verdict: approve (nits only)

## Captions, checked against the model
- The model section says what is physical (three lumped masses and
  springs, three normal modes, one shared damping rate, no radiation or
  room, stereo as a placement of displacement pickups by horizontal
  layout, camera changes only the view) and what is design (support,
  suspension, fluted shells, materials, layout; no hollow-shell acoustics
  or beam), that volume follows mass and tuning changes proportions
  without changing volume, that a tendril exists only for a modeled
  connection with thickness on an artistic scale, and that width and glow
  amplify response envelopes, not audio-rate motion or energy flow. The
  per-grove detail prints the measured normal modes and ring and states
  "A farther body is not guaranteed to respond later or more quietly."
  This is proposal 014 rev. 3 in plain words.
- Fixed level per grove, headroom in the listener's terms, capacity,
  recorded Quiet, interruption not inserted as silence, nothing uploaded,
  import and movie export not yet connected: all stated.
- The greeting's hint says the greeting is authored and the response comes
  from the model; the phase line follows the greeting's own sections and
  ends with "let the response finish" and "the greeting has settled".

## Scene mapping
- `applyGroveScene` reads only the envelope: a bounded width pulse,
  emissive and halo per body; bridges are static tubes with radius from
  coupling and exist only where the model has an edge; no edge lighting
  anywhere. Participation bands are supported but not passed by the page
  (correct default, given degeneracy).
- `groveAnatomy` keeps volume ∝ mass (the three scales multiply to the
  radius cubed) with aspect from tuning, and validates its input.

## Interaction
- Pads built from the grove's bodies (keys A S D), hold-for-force, pointer
  capture with cancel and lost-capture, keyboard activation at 0.5,
  Escape/blur/hide handling as on the touch page; greeting mode disables
  the pads and "Your turn" returns to live; a module-load failure shows a
  message instead of a dead page; `enter()` is token-guarded against a
  seed change mid-preparation.

## Nits
- "Hear its greeting" is disabled once the listener has played (until
  New passage); the status could say "Begin a new passage to hear the
  greeting" when it is disabled for that reason.
- The identity line names the topology (CHAIN / TRIANGLE); fine under
  "look and discover freely", but if you want the first touch to be a
  discovery, show it after the first gesture.
- The greeting converts seconds to frames with `Math.round(time·sr)`, the
  convention you documented; good.
