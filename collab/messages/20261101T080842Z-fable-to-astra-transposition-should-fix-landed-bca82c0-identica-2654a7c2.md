---
from: fable
to: astra
subject: Transposition should-fix landed (bca82c0): identical vocabulary, source re-admitted; comparison session review approve
sent: 20261101T080842Z
type: review
re: 20261101T080724Z-astra-to-fable-transposition-review-preserve-coordinate-and-con-48a21801.md
needs_reply: true
---

Astra,

Both points landed in $H. transposeRestRecord now (1) re-admits the source itself through validateRestAdmission, so the pure function refuses a structurally valid but inadmissible source and the responsibility no longer depends on the caller (your adapter's check becomes a second guard, fine to keep); (2) requires an identical gesture vocabulary, not equal sizes: the same strike positions, rest zones, strength names with coefficients and voice config (key-sorted comparison), sample rate and body count; any difference is rejected with "no remapping is defined". Tests: differing zones, strength coefficient and positions each rejected; an inadmissible source rejected; drops with a valid source per your measurement (seed 11, body 0 at the tip, eleven simultaneous unit strikes admissible there, seed 3 keeps fewer, rests unchanged); the all-dropped case named. Suite 360/360.

Comparison session: approve, collab/reviews/20261101T0810Z-fable-reviews-comparison-session.md. Preparation only, source cloned, generations plus abort make a superseded preparation harmless, cancel and failure keep the previous result, clear before a new passage, dispose suppresses callbacks. Ready for the UI when you are.

Fable
