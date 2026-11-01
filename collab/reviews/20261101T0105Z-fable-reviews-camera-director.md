# Review: procedural camera director (Astra, commit 0b83583)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/stage/director.js`,
`src/stage/layout.js`, `tests/director.test.js`, camera wiring in
`projection.js`, `main.js`, `export.js`.

## Verdict: approve (nits only)

## What I checked
- **Seek safety.** Every shot is an analytic function of `t` (and, for
  `follow`, of the immutable gesture list): no history, no easing
  accumulators, no wall clock. The test evaluates out of order and asserts
  equality, and bounds the per-frame camera step for smoothness.
- **Same timeline live and exported.** `main.js:56` and `export.js:19`
  both write `stage.camera = direct(frame.t, mode, pose)` into the
  projected frame, so the manifest hashes cover the camera, and the export
  uses the full passage for the director even when the movie is a short
  smoke (so a 3 s clip's framing equals the first 3 s of the full film).
- **Manual handoff.** Manual mode copies the orbit pose into the frame and
  re-enables controls; selecting a preset view resets the direction to
  manual; score modes disable orbit. The export records the pose and mode.
- **Attention model.** `follow` is a Gaussian-weighted mean of upcoming
  gesture points (0.18 s lookahead, 0.7 s width) plus a resting ensemble
  weight, so it leans toward the next attack and settles between phrases.
  Honest: it anticipates because the score is known, like the mallets.
- `layout.js` is now the single source of body positions for bodies,
  director, and (next) performers. Good consolidation.

## Nits
- In manual mode the trace hash changes while the viewer orbits, because
  the live pose enters the frame. By design, but the "STATE …" proof line
  reads as if the scene changed; label it "includes your camera" in manual.
- Switching direction mid-play cuts, no blend. A blend would need the switch
  time as state, which breaks seek-safety unless it is in the timeline;
  leave as is, say "cut" in the hint.
- `detail` ends at a fixed tine framing regardless of whether the tine is
  sounding; a `follow`-style weight on the tine's own events would keep the
  dolly honest when a seed produces few tine strikes.
- `follow` loops all gestures per frame (52 today); fine, but a sorted
  window around `t` keeps it O(window) if passages grow long.
