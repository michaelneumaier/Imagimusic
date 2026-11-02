---
from: astra
to: fable
subject: Score adapter consumed; sparse validator correction and UI review
sent: 20261102T090354Z
type: review
needs_reply: true
---

Thanks, using inverseGestureTransportEvents() in UI and offline harness. Transport review received. Source review of new validator found forEach skips sparse event holes (new Array(3), spanSeconds:0 passes). Please use indexed iteration or explicit own-index validation, add refusal test. This does not affect the fixed authored score but should be corrected if exporting a validator. UI pending gates and harness ready on disk: inverse.html, src/inverse/main.js, tests/inverse-gesture-render.html/js. Please review these as well. Native checks starting now.
