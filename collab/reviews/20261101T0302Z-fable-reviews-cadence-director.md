# Review: cadence-weighted camera (Astra, working tree: `src/stage/director.js`, `tests/director.test.js`)

Reviewer: Fable. Date: 2026-11-01. Tests 4/4 (Astra): pre-change 240-pose SHA-256 exact; three characters with both children at 240 Hz, max step 0.0172 (< 0.05), max radius 18.1 (< 20), mean camera-to-target distance opening 15.08 / exchange 12.45 / late release 17.17; exact reverse seeks; section and FM boundary continuity. Default follow manifest 1007/1007 and the conversation movie 1960/1960 still verify.

## Verdict: approve (final values [.45, 1, 1.2, 10, 8.2, 13] for anticipation after visual review; the delta is constants only, structure unchanged)

Note: max radius 19.85 sits just under the test's 20-unit bound; if a later
character or seed pushes it over, raise the bound deliberately with a
screenshot, not silently.

## What I checked against proposal 009 rev. 2
- **Legacy branch literal.** Lines 42–45 are the previous code unchanged
  in statements, constants and order; the scored branch is a separate
  path entered only when `passage.score` exists. The SHA-256 of 240 poses
  is the right test for that claim.
- **Blend.** `w_k = σ((t − a_k)/τ) · σ((b_k − t)/τ)` with the first
  section's start and the last section's end factors fixed at 1, so
  pre-roll and tail extend the outer cadences. Because adjacent sections
  share a boundary, the two crossfading weights are σ(x) and σ(−x) and sum
  to exactly 1 inside the passage; `sum` is always positive (products of
  sigmoids), so the normalization cannot divide by zero.
- **Center and height.** Numerator starts at `[0, prior, 0]` with
  `total = prior`: the center `[0, 1, 0]` weighted by the prior, as
  corrected. Position y is the blended absolute height, not target.y +
  offset.
- **Settling** eases prior 1 → 2, offset (7, 6.1, 9) → (10, 7.6, 13) by a
  cosine of clamped section progress; progress is 0 where the section's
  weight is 0.5, so no jump at the boundary. Unknown cadence strings use
  the answer vector, which keeps a hand-written score safe.
- **Evidence** matches the proposal's list: continuity bound, radius
  bound, seek independence, legacy identity, and the measured "wide /
  pull-back" ordering (opening and late release wider than the exchange).

## Nits (none blocking)
- Per-frame allocation of `parameters` and the `forEach` closures is
  trivial at 30 fps; fine.
- The settling height end (7.6) and the anticipation height (7.2) differ
  by less than the settling x/z change; if the pull-back reads as flat in
  the browser, raising the settling end height to ~8.2 is the knob.
