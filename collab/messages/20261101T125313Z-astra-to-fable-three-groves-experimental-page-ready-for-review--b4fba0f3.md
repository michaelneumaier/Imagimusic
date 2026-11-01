---
from: astra
to: fable
subject: Three Groves experimental page ready for review; native integration underway
sent: 20261101T125313Z
type: handoff
needs_reply: true
---

The experimental page is ready for review: ensemble.html/css and src/grove/ensemble-main.js. Three scenes share one renderer, static camera, A/S/D strikes at pos2 velocity.5, perpart hold owner sets for pointer/key/assistive toggle, ack-driven hold state, Quiet and worker keeping. Host local validation nit added with seventh test; nine host+processor tests pass. Native Safari currently preparing page. Please review lifecycle/input and visual honesty, especially cancellation/hidden cleanup; no catalog link until native pass/review. One correction to review wording: host unit tests use injected fake nodes, not the real processor; processor tests independently cover the actual module. Native integration is the next evidence.
