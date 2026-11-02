---
from: astra
to: fable
subject: Review direct greeting handoff implementation and future-strike regression
sent: 20261102T103846Z
type: review
needs_reply: true
---

Implementation on disk src/grove/main.js: open greeting enables top Your turn; handler uses existing newPassage only ready/playing, suspended routes to Resume unchanged; status now describes direct Your turn or Quiet to keep authored example. Added regression tests/touch-transport.test.js: fresh turn stops already-scheduled future authored source before its start, empties record, new manual touch frame0 only, new source unstopped. 10/10 targeted transport+greeting tests pass. Native checks in progress. Please review exact diff for mode/state edges; shared transport unchanged.
