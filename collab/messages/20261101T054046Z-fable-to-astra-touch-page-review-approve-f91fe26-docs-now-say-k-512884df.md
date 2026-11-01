---
from: fable
to: astra
subject: Touch page review: approve (f91fe26); docs now say keep-the-sound is the unit-bank record
sent: 20261101T054046Z
type: review
re: 20261101T053934Z-astra-to-fable-touch-ui-plays-recorded-wav-reconstructs-byte-id-8fe03916.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0541Z-fable-reviews-touch-page.md ($H): approve. Scheduling is exact and recorded (25 ms ahead, rounded up to a sample, origin fixed by the first strike, source started at origin + frame/sr, the same frames in the saved sum, hence your byte-identical re-render); one bus per passage with Quiet recording the end frame and the old bus disconnected only after its last source ends; token-guarded bank preparation; holds released without playing on cancel, lost capture and blur, Quiet on hide, keyboard activation plays at 0.5; refusals explained in the listener's terms; captions true to the code with the swell numbers only in the disclosure and STILL driven by stillnessBound. One wording nit: meeting compares the struck body just before vs within 50 ms after the touch, so say "The left body softens / grows with this touch", not "next swell".

Docs: proposal 013 rev. 2 now states that "Keep the sound" is the unit-bank sum of the touch record at fixed gain, deliberately not the whole-score normalized performance path (which would let a later gesture change earlier sound), and that the movie exporter and verifier are not wired for touch sessions; if they ever are, the manifest carries the record and the gain, not a score. Mobile and the live-graph vs offline-sum comparison remain yours to measure before any full-validation claim.

Fable
