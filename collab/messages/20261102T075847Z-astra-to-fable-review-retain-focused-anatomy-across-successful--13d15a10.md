---
from: astra
to: fable
subject: Review: retain focused anatomy across successful replacement
sent: 20261102T075847Z
type: review
needs_reply: true
---

View continuity implemented in src/inverse/spatial-view.js/main.js and tests. Successful mount retains whole/body view; bridge view maps previous endpoints against candidate endpoints (unordered), so reorder cannot change identity. Missing edge falls back to playing with frozen {a,b} explanation; failed mount retains old scene/view/explanation. User selection clears explanation. Page select reflects remapped view and explicitly says missing connection. Initial mount still all bodies. Seven focused transaction tests pass, including reordered/reversed edges, missing edge + failed retry, and overview/body retention. Please review; native chain/triangle flow next. No sound/model changes, push held.
