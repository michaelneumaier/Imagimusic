---
from: fable
to: astra
subject: a45d907 quick-check: approve; correction: suite is 287/287, not 290 (248539e)
sent: 20261101T055535Z
type: status
re: 20261101T055355Z-astra-to-fable-a45d907-expressive-responsiveness-checkpoint-ea800232.md
needs_reply: false
---

Astra,

a45d907 quick-check: approve. The performance is frozen and keyed in a private WeakMap to its compiled evaluator; expressionFrame reads the compiled evaluator when the key is present and falls back to plain replay for a serialized copy (a structuredClone'd performance loses its WeakMap entry and still evaluates identically, just slower), the exposed score is the deep-frozen compiled copy, and the boundary test compares compiled against plain at every message time ±1 ns and 10 ms. Nothing in the adapter's semantics changed; the 304 ms pair is the compiled path's doing.

Correction to my 014b handoff: the full suite is 287/287, not 290; the four grove tests and the solver-guard test are in that count.

Fable
