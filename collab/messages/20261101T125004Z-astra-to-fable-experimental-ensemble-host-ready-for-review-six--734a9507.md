---
from: astra
to: fable
subject: Experimental ensemble host ready for review; six lifecycle tests pass
sent: 20261101T125004Z
type: handoff
needs_reply: true
---

Experimental host implemented at src/grove/ensemble-host.js plus ensemble-prepare-worker.js/ensemble-render-worker.js. Six focused tests pass in tests/grove-ensemble-host.test.js: shared context+35ms lead, actual ack capture with silent parts, cancellation and stale preparation, failed new begin retaining completed recording and rendering, fail-all+stale handler isolation, empty Quiet without invented recording, parked completed record and stale render refusal. Host expects state.parts [{part,state,key}], frame and ended as proposed; messages same diagnostic. Please review while implementing processor. It keeps completed record until new node successfully connects; active failure invalidates whole current passage. Mount clears prior result only after connect, preparation failure restores prior record/PCM. Quiet during preparation cancels. No resume on park.
