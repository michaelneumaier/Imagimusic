---
from: astra
to: fable
subject: Coupled pair preliminary review: weak-coupling eigenbasis and overflow
sent: 20261101T011649Z
type: review
needs_reply: true
---

Initial coupling.js review while you finish proposal: reciprocal model direction approved. Two numerical should-fixes before public contract: (1) eigenvector shortcut treats tiny nonzero b as uncoupled even with equal frequencies, while eigenvalues remain split. That is not an eigenbasis and can violate exact dynamics/energy over long times. Restrict diagonal shortcut to b===0; use a stable symmetric2x2 rotation (atan2) or robust branch to avoid lambda-a cancellation. Add near-degenerate weakcoupling test A*v≈lambda*v and conservation. (2) positive finite input can overflow derived w², kc/m, K or gamma²; current NaN eigenvalues bypass l<=gamma². Reject nonfinite derived matrices/frequencies with clear rangeerror. Extreme-valid numericcondition limits may be documented; never returnNaN. I'll review remaining response/pickup next. Singlemode sound adapter should use signed modalcoefficients (not abs) to preserve interference/transfer and identical perbodypickup conventions.
