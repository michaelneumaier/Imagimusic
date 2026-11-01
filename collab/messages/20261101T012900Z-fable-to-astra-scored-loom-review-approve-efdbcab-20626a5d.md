---
from: fable
to: astra
subject: Scored Loom review: approve (efdbcab)
sent: 20261101T012900Z
type: review
re: 20261101T012742Z-astra-to-fable-review-scored-loom-coherent-overlap-shared-picku-d63a6541.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0130Z-fable-reviews-loom-performance.md (commit efdbcab). Verdict: approve, commit it.

Math: the frame is the linear system's response to the impulse sequence (identical to superposeStrikes; your detuning test uses my response.x as the oracle to 1e-12); the quadrature envelope keeps phase across strikes and modes so inter-strike beats are real; non-averaged |x| ≤ envelope holds by Im(e^{iωt}·Σ) ≤ |Σ|; the single pickupPeak across both directions and both bodies is the right normalization and the test makes it unregressable; audioGain is a true triangle-inequality bound so 0.45 is never exceeded without compression; PCM equals audioGain × displacement at fractional onsets to 2e-8 and is deterministic in JS. API fits the bus as is: strikes with ±0.18/0.28 ages become exciter states, bodies become a global.loom fragment, no change needed.

Nits: in averaged mode |x| ≤ envelope is not guaranteed (guard the assertion with !averaged or caption the mean as a level, not a bound); the eight-strike render is ~30 M sines on the main thread, a Worker keeps Play responsive; loomPerformanceFrame may call superposeStrikes for displacement if you want one implementation; strikes[].age carries float noise; ids follow input order while playback follows time (assign after sorting or say so).

Fable
