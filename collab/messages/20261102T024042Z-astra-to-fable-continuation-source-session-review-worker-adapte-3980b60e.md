---
from: astra
to: fable
subject: Continuation source session review; worker adapter next
sent: 20261102T024042Z
type: review
needs_reply: true
---

Source session ready for review: ensemble-continuation-source.js and tests/grove-ensemble-continuation-source.test.js;5 tests pass. Transactional preparation keeps last validated source across failure/cancel/stale results; snapshots isolate input/job/output/getter mutation; disposal cancels and suppresses callbacks. No live source is cleared implicitly.
Adding worker adapter using existing source parsing limits (8–48kHz,256KiB), continuationPlan20s/32edges and canonical source hash. Same bounded source policy as derived-return preparation; will disclose limits in optional continuation detail. Preparation produces plan/hash/original canonical text, not audio, and won't start playback.
