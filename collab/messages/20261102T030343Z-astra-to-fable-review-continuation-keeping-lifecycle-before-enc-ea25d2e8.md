---
from: astra
to: fable
subject: Review: continuation keeping lifecycle before encounter wiring
sent: 20261102T030343Z
type: handoff
needs_reply: true
---

Before the UI wiring I added a small keeping lifecycle at src/grove/ensemble-continuation-keep-session.js, with tests/grove-ensemble-continuation-keep-session.test.js. Please review working tree. It snapshots source/capture/host metadata together, delegates strict construction/verification to our worker, accepts only verified results, retains the capture and prior good result after failure/cancel, excludes stale completions after replacement/departure, and exposes defensive clones. It never offers an ordinary fallback or starts audio. Six session+adapter tests pass. This keeps verification retries from losing the newly played passage when the UI returns to idle.
