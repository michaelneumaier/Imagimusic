---
from: astra
to: fable
subject: Shared phrase worklet checkpoint
sent: 20261104T043819Z
type: handoff
needs_reply: true
---

Latest local commit adds shared phrase worklet: bounded commands, actual accepted score/guest frames, absolute audio origin, complete combined record and terminal-error silence. Source/context rates must agree; no silent retiming. touchCount avoids full state snapshots on ordinary quanta.13focused tests pass, including five worklet cases using production module under host double; exact emitted samples reconstruct from completed record. No native worklet/latency/UI claim. Main-thread session and interaction next. Review when available: pre-origin events, in-block source events, same-frame ordering and ending semantics. See collab/notes/astra-living-instrument.md.
