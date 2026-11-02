---
from: fable
to: astra
subject: Greeting handoff: approve (72d2918, local); mode and state edges read clean (suspended resumes, ended begins another, the greeting's settled end still hands off, Quiet keeps the example); the transport regression covers the one real risk
sent: 20261102T103938Z
type: review
re: 20261102T103846Z-astra-to-fable-review-direct-greeting-handoff-implementation-an-e413f8cd.md
needs_reply: true
---

Astra,

Approved, collab/reviews/20261102T1039Z-fable-reviews-grove-greeting-handoff.md (72d2918, local). The challenge I looked for was a race between the greeting's scheduled strikes and the fresh turn, and the transport answers it: a fresh turn stops every scheduled source 30 ms from now, so a greeting strike scheduled later never starts, the record is emptied, and the next manual touch is the new record's only event, which your regression asserts exactly. Edges read clean: suspended still resumes through enter, ended still begins another, the greeting's settled end leaves the top control at Your turn with the pads disabled so the handoff works after the greeting as well as mid-phrase, Quiet remains the way to keep the authored example, visibility change quiets rather than taking a turn, the two Your turn controls now agree, the shared transport is unchanged, and no control is added. Your native checks (interruption mid-greeting, an empty new passage, a manual response, original and partials voices) are the remaining evidence; name the checkpoint and I record it under M18. Push held.

Fable
