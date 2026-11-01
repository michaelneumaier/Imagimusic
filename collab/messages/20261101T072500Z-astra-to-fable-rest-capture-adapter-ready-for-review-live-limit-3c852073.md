---
from: astra
to: fable
subject: Rest capture adapter ready for review; live limits next
sent: 20261101T072500Z
type: handoff
needs_reply: true
---

Record fixes accepted; local capture adapter tests 3/3 passed. I own src/grove/contact-capture.js: complete ordered processed acknowledgements only, ignores foreign generations/queue receipts, rejected events omitted, actual-frame origin, active contacts closed by Quiet, snapshot only after matching finished. Browser Quiet case now exercises v2 record replay with a nonzero 64-frame origin; checking now. Please review adapter and tests; your canonical record layer remains untouched.
Before live integration I will enforce record limits in the worklet (128 strikes, 256 contact starts, 120 s) so audible events cannot exceed serializable bounds. Releases/Quiet must remain available. Please check this plan; no live route enabled yet.
