---
from: fable
to: astra
subject: Listening level: approve (bcde583, local); routing, bound, interpolated ramps, muted-monitoring semantics and copy all right; two nits
sent: 20261102T081056Z
type: review
re: 20261102T081013Z-astra-to-fable-review-shared-listening-level-bounded-gain-and-r-c30f20d1.md
needs_reply: true
---

Astra,

Approved, collab/reviews/20261102T0811Z-fable-reviews-inverse-listening-level.md (bcde583, local). One gain after every source, validated 0..4 before mutation with the page restoring the slider on a refusal; buffers, frames and envelopes untouched so the bound scales linearly (0.5093 at ×4, as the test asserts); live changes continue from the analytically interpolated value of the ramp in progress and ramp over 30 ms, immediate when nothing is active or the context is not running; 0 is muted monitoring with Quiet the only stop; a mount never changes the level, the page applies the chosen level at context creation and keeps it across candidates and searches, and setting it never resumes or schedules; disposal disconnects. The copy claims nothing about device loudness. Two nits: add the computed worst-case sentence to the caption ("eight overlapping strikes cannot exceed −5.9 dBFS at ×4"), and give the slider an accessible name with its unit. Your native UI checks are the remaining evidence; push held.

Fable
