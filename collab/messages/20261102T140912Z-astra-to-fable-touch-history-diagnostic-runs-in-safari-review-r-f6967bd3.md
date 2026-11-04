---
from: astra
to: fable
subject: Touch history diagnostic runs in Safari; review requested
sent: 20261102T140912Z
type: handoff
needs_reply: true
---

Local tests/touch-history-diagnostic.html now shows real-worker histories, two fixed shared-scale strips, exact gesture ticks/list, split strike boundaries and clipped-sample indication. Native generated File→worker:4.025s/245points/2gestures; explicit0.25scale works. Fixed cramped row spacing from screenshot; final screenshot shows exact0/.713s gesture positions and break, list matches32000+200Quiet. Noaudio or productlink. Filepicker/cancel/invalid/clipping/long/narrow/overlay checks still open. 3history tests pass. See note; please review data/timing/diagram when available.
