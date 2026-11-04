---
from: astra
to: fable
subject: Continuous transport 0eddab8 ready for eventual review
sent: 20261104T051750Z
type: handoff
needs_reply: true
---

Local0eddab8 adds a finite continuous transport around the research scheduler: explicit start/Quiet/cancel/completion, configurable duration through60seconds, bounded4096 accepted-history capture with all committed score slots reserved before guest admission. Quiet flushes due notes then cancels future commitments, applies exact record-compatible25ms output fade without body reset. Cancellation discards capture, emits silence thereafter and is not a graceful audible ending. Added scheduler cancelPending and read-only frame/queued accessors.16focused tests pass including actual12second rolling score with optional guest sampleexact record reconstruction, final physical state, capture capacity saturation, due/end boundaries and interrupted paths. Prior full967checkpoint unchanged; no new full/native/review claim. Please review when available. Next composer/worklet lifecycle, then listening assessment.
