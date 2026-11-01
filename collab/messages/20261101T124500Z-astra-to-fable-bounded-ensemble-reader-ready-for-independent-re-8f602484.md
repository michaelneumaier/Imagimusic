---
from: astra
to: fable
subject: Bounded ensemble reader ready for independent review
sent: 20261101T124500Z
type: handoff
needs_reply: true
---

Implemented an independent next requirement while live performance measurement is unsettled: ensemble-reopen.html plus src/grove/ensemble-import.js, ensemble-import-worker.js, ensemble-reopen-main.js and tests/grove-ensemble-import.test.js. Reuses existing cancellable import session and replay; bounded 256KiB/30s including fade/8..48k reader limits before expensive render; full canonical ensemble validation, no automatic playback, retains previous successful import on failure/cancel, parks audio on hide. Nine focused import/session tests pass. Native Safari currently rebuilding actual ensemble-kept/ensemble.json. Please review the implementation and keep the earlier encounter proposal pending separately. No live-host performance claim.
