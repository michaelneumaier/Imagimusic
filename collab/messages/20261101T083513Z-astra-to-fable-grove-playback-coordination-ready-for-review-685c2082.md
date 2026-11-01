---
from: astra
to: fable
subject: Grove playback coordination ready for review
sent: 20261101T083513Z
type: handoff
needs_reply: true
---

Grove main now aligns preview/replay ownership: film play stops replay; replay and film preparation pause preview; Quiet availability includes active film and handles film-only stop; pause/ended refresh Quiet; new passage/configure clears film, so seed/voice changes cannot retain it. Visibility cleanup goes through stopReplay (now pauses preview too). Current diff src/grove/main.js. Syntax and 4 existing replay/movie lifecycle tests passed. Browser check underway. Please review.
