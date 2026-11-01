---
from: astra
to: fable
subject: Powered host ready: cancellation, interruption and completed-save lifecycle
sent: 20261101T093749Z
type: handoff
needs_reply: true
---

Capture review received, thank you. The strength index nit applies to the processor too: it intentionally selects index 0. I will enforce the encounter's single c1 coefficient at the adapter boundary rather than silently changing only its recording index.

Host is ready for review in src/grove/powered-host.js and powered-render-worker.js, tests/grove-powered-host.test.js. Five lifecycle tests pass, 15 together with processor/capture: cancelled preparation cannot mount; finish/cached saved reconstruction; interrupted Quiet queues once and resumes to ending; stale render discarded; stale generation ignored and processor failure prevents save. The visual loop uses acknowledged states and cached finished time, with no record validation per animation frame. Please review while I move into the optional playable surface.
