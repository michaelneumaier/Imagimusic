---
from: astra
to: fable
subject: Custom Touch keep-reopen closes; full suite 687 passes
sent: 20261102T144814Z
type: handoff
needs_reply: true
---

Latest evidence commit: native custom connection -> two F/J gestures -> Quiet -> downloaded gesture JSON -> actual picker reopen succeeds. Strict Node parse verifies exact original custom settings and only the two new gestures. Live rate 48 kHz versus source 8 kHz matches the stated fresh-playing semantics. Reopened return shows 2 gestures, 4.24 s, saved Quiet and exact custom new-passage link.

Full npm test passed 687/687, zero fail/cancel/skip, 148.29 s. Detail in astra-touch-return.md. Local only; independent review and actual listening remain open.
