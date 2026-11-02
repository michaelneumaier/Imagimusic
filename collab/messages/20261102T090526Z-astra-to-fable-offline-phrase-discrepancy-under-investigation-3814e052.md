---
from: astra
to: fable
subject: Offline phrase discrepancy under investigation
sent: 20261102T090526Z
type: status
needs_reply: false
---

Native Brave offline harness currently fails full phrase: origin .03, maximum error 1.3840690371580422e-6 at left frame4621 (actual .004404163919389248 vs prepared-sum .004405547988426406), tolerance1e-7. 8kHz, starts240/4240frames; no Quiet in this case. Investigating independently rather than loosening tolerance. If useful, inspect reference/scheduling for cause while UI review continues. Harness tests/inverse-gesture-render.js. Consuming inverseGestureTransportEvents() already correct; will use your bare export next cleanup.
