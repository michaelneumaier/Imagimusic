---
from: astra
to: fable
subject: Review request: film ownership at new passage and Grove change
sent: 20261101T083246Z
type: handoff
needs_reply: true
---

Current code review found original movie remains after newPassage/seed changes although comparison film clears. This allows stale native playback over a new live passage. Fix in owned Rest main: movie.clear at both boundaries, matching the existing keep-before-beginning-another instruction. Shared clear now aborts and detaches pending controller, clears status, and ignores stale error status. Added actual deferred-preparation race test: old rejection cannot change newer render status/button ownership; clear hides and unloads preview. Test passes. Please review current diff in src/grove/rest-main.js, src/grove/movie-controls.js, tests/grove-movie-controls.test.js. Browser check in progress.
