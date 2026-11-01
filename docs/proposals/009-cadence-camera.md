# Proposal 009: cadence-weighted camera for the conversation (source-level, for Astra's `director.js`)

*Fable, 2026-11-01. Astra owns `src/stage/director.js`; this is the concrete
behavior and the maths, not code to merge. Follow mode only. Legacy
passages (no `score`) must produce the identical pose they do today.*

## Behavior

| Cadence | Feel | Attention lead (s) | Gesture width (s) | Ensemble prior | Offset from target (x, y, z) |
| --- | --- | --- | --- | --- | --- |
| anticipation (opening) | wide and slow; the Keeper's approach is seen, the camera does not lunge | 0.45 | 1.0 | 0.9 | (8.5, 7.2, 11) |
| answer (exchange) | today's follow: leans to each attack, settles to the ensemble | 0.18 | 0.7 | 0.25 | (7, 6.1, 9) |
| settling (release) | a slow pull-back to the whole stage as excitations thin | 0.10 | 1.2 | 1.0 → 2.0 with section progress | (7, 6.1, 9) → (10, 7.6, 13) with section progress |

"Ensemble prior" is the weight of the fixed stage center `[0, .25, 0]`
in the attention average (today's `total = .25`). A larger prior means
the camera stays with the ensemble; a smaller one means it follows
strikes. "Lead" is today's `t + .18`; "width" is today's `.7`.

## Maths (analytic, seek-independent, bounded, smooth)

Let the score's sections be `[a_k, b_k)` in seconds (`beatSeconds`), with
`a_0 = −∞` and `b_last = +∞` so pre-roll and tail extend the first and
last cadence. With `τ = 60 / tempo` (one beat) and `σ(x) = ½ + ½ tanh(x)`:

```
w_k(t) = σ((t − a_k) / τ) · σ((b_k − t) / τ)          // ≈ 1 inside, crossfades over about ±1 beat at each boundary
W(t)   = Σ_k w_k(t)                                     // > 0 everywhere; normalize: ŵ_k = w_k / W
```

Each cadence has a parameter vector `P_c = (lead, width, prior, ox, oy, oz)`
from the table; the settling vector depends on section progress
`p = (t − a_k) / (b_k − a_k)` clamped to [0, 1] (continuous, and its
weight is 0.5 at the boundary where `p = 0`, so no jump):

```
P_settling(p) = lerp(P_settling_start, P_settling_end, ½ − ½ cos(π p))
P(t) = Σ_k ŵ_k(t) · P_{cadence(k)}(t)                   // convex blend of bounded vectors ⇒ bounded
```

Then today's follow computation with the blended parameters:

```
target = prior·[0, .25, 0] + Σ_g weight_g · point_g,   weight_g = velocity_g · exp(−½ ((t + lead − time_g) / width)²)
target /= prior + Σ_g weight_g
pose = { target, position: target + (ox, oy, oz) }
```

Every term is a smooth function of `t` alone (tanh, Gaussian, cosine):
no frame history, easing accumulators or wall clock, so seeking in any
direction gives the same pose, and the pose is bounded by the gesture
points' hull plus the largest offset.

**Legacy identity:** when `passage.score` is absent, set `ŵ = {answer: 1}`
and `P = P_answer = (0.18, 0.7, 0.25, 7, 6.1, 9)`, which is today's code
exactly. Suggested test: for the seeded passage, the new director equals
the old one at 240 sampled times, bit for bit.

## Evidence (tests Astra can add; all pure)

- **Continuity:** for the generated score with both children, max pose
  change between `t` and `t + 1/240 s` over the whole passage below a
  stated bound (e.g. 0.05 units), including the three section boundaries
  and the FM entrance.
- **Bounded:** position radius below 20 units for all `t`.
- **Seek independence:** `pose(t)` after evaluating a random sequence of
  other times equals `pose(t)` evaluated first.
- **Legacy identity:** as above.
- **Cadence is visible:** average distance from target to position over
  the opening > over the exchange; over the last 4 s of the release >
  over the exchange (so "wide" and "pull-back" are measured, not
  described).

## Not in scope

No change to sound, timing, bindings or `stage.camera`'s binding label
("interpreted; it changes framing, never sound"). Manual, establish and
detail modes unchanged.
