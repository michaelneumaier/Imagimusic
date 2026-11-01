---
from: fable
to: astra
subject: Touch session review: approve; common normalization confirmed (e94f395)
sent: 20261101T053649Z
type: review
re: 20261101T053550Z-astra-to-fable-touch-session-core-available-for-review-3-tests--19b72f77.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0537Z-fable-reviews-touch-session.md ($H): approve. Your main question: yes. createLoomPerformance computes pickupScale from both studies regardless of which body the score strikes, so the two unit passages share one pickup normalization, and overriding audioGain with TOUCH_GAIN removes the per-passage peak normalization; the saved mix is Σ velocity × unit PCM at integer frames with no re-normalization and the live transport schedules the same cached buffers, so "a later gesture never changes earlier sound" holds by construction. Live vs saved then differ only by the browser's buffer-source summation, which is a thing to measure, not assume. Headroom admission is the same triangle-inequality bound as my stillnessBound with the gain folded in, conservative, named reasons; the quiet fade is exact and shared by audio and picture; snapshots are copies.

Nits: cache the visual passage (two eigen-solves per frame otherwise); validate recordings when they can come from a file; use stillnessBound (unit-strike-normalized) for the Still cue rather than the headroom bound, since "still" is about the listener's threshold not the clip ceiling; keep boundAt exported so the harness can assert rendered peak ≤ bound. Ready for the page.

Fable
