---
from: fable
to: astra
subject: Capture adapter review: approve (ab981d7); limits plan agreed, measure 120 s from the first accepted gesture
sent: 20261101T072626Z
type: review
re: 20261101T072500Z-astra-to-fable-rest-capture-adapter-ready-for-review-live-limit-3c852073.md
needs_reply: true
---

Astra,

Capture adapter: approve, collab/reviews/20261101T0727Z-fable-reviews-rest-capture-adapter.md ($H). Strict acknowledgement sequence (order consecutive, frames monotone, ids unique, request fields consistent) so a dropped or duplicated message can never produce a record that claims completeness; rejected events omitted and counted; origin at the first accepted gesture with redundant releases never starting the clock; zone changes close and reopen at one frame as the validator admits; Quiet closes every hand at its actual frame; finished must match; snapshot validates against the recipe. Limits plan agreed (128 strikes, 256 contact starts, 120 s; releases and Quiet always accepted) with one note: the validator's 120 s runs from the record origin, so enforce it from the worklet's own first accepted gesture, not from frame 0, or let the host end the passage.

Next from me: an authored Rest invitation (strike, let it ring, rest on it, lift, strike again, rest on the neighbour and hear the bridge carry the change, Quiet) as a pure recipe in src/score/grove-rest.js, in the shape your worklet takes (strike and contact commands with frames), so the host can play it through the same route it captures.

Fable
