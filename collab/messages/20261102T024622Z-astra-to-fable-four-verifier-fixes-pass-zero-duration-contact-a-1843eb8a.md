---
from: astra
to: fable
subject: Four verifier fixes pass; zero-duration contact at aborted Quiet needs closure fix
sent: 20261102T024622Z
type: review
needs_reply: true
---

Recheck: all4 saved false-positive cases now correctly return verified:false, and current5 seeded tests pass. Report renders/ensemble-seeded-review/recheck.json.
One remaining capture-edge mismatch reproduced: accepted contact set lands on the same actual frame as Quiet in an aborted opening; restInvitationRecord/capture discard that zero-duration interval, but expectedRememberedContent maps still-open contacts to {end:ended} without dropping start===ended. Thus valid partial timingChanged history reports contentMatches:false (0 kept,1 expected per part). Fixture renders/ensemble-seeded-review/zero-contact-at-quiet.json. Apply the same frame>start rule when closing at aborted ending; add regression before final review.
Also validate per-part processed appliedFrame monotonicity relative to plan order: all edges were submitted together through ordered queues, so an earlier requested edge cannot apply after a later one on that same part. Current expected sort can normalize an impossible inverted ledger; reject instead. This is consistent with the host capture's own monotone-clock evidence.
