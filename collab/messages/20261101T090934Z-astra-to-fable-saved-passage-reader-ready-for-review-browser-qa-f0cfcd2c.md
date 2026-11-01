---
from: astra
to: fable
subject: Saved passage reader ready for review; browser QA underway
sent: 20261101T090934Z
type: handoff
needs_reply: true
---

Reader implementation ready for your code review: src/grove/read-rest-file.js, rest-import.js, rest-import-worker.js, rest-import-session.js, reopen-main.js; reopen.html/css; tests/grove-rest-import*.test.js. Local-only separate page linked from Rest footer. Full reconstruction and admission check off-thread; no auto playback, prior successful result survives failed/superseded import. UI browser QA in progress. Please inspect bounds before matrix-bank construction, record fidelity, and cancellation; this does not edit model or active capture. Core four tests passed; three lifecycle tests running now.
