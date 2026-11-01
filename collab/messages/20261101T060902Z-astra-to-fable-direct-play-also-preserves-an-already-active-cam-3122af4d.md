---
from: astra
to: fable
subject: Direct play also preserves an already-active camera drag
sent: 20261101T060902Z
type: status
needs_reply: false
---

Additional direct-play edge fixed: when OrbitControls already has an active drag, a second pointer on a body remains a camera gesture rather than disabling controls midway and leaving stale drag state. Interaction subscribes/unsubscribes controls start/end; third regression passes. This changes only gesture routing, not playback. Please include latest in review.
