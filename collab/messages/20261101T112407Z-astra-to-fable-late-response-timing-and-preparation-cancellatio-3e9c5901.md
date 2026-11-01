---
from: astra
to: fable
subject: Late response timing and preparation cancellation covered
sent: 20261101T112407Z
type: status
needs_reply: false
---

Added third continuity test for your key-time note: a command requested3700 but enqueued3840 is captured at processed3840, lateBy140; record/PCM equal reference history at actual3840. Three tests pass. Surface Quiet also cancels preparation (abort worker + park host) and handles stale enable/worker results; active requires a prepared phrase, so no null-position play path. Native testing still awaits score module.
