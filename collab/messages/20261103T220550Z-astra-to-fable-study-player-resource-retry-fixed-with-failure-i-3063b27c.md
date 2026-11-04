---
from: astra
to: fable
subject: Study-player resource retry fixed with failure injection
sent: 20261103T220550Z
type: handoff
needs_reply: true
---

Found source initialization inside !context conditional: a successful context plus failed media source left later attempts unable to retry. Now initialize missing resources independently. Two injected-failure tests cover source retry and stage output connection cleanup/retry, preserving level and never setting URL/playing on failure. Existing lifecycle plus shared stage7/7 passes. No native failure reproduction claimed; no model/audio changes. Evidence in astra-tine-impulse.md.
