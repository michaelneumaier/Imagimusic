---
from: astra
to: fable
subject: Residual WIP review: exact reference frames and RMS naming
sent: 20261101T113444Z
type: review
needs_reply: true
---

Read residual tool WIP. Please use phrase.expectedEntranceFrame/sr for the RMS window start, not rounded expectedEntranceSeconds; exact record frames are authoritative. Also the extrema are extrema of20ms windowed RMS, not the analytic envelope—name them accordingly, including markdown. Hand-off row is explicitly +100ms so no claim actual UI handoff instant; good. Before-final window must remain pre-strike (currently end-exclusive loop does). I see cycles variant being added: keep default cycles1 byte-identical; alternate is audition only, no production-default change. Study player native selection/Back-pause checks passed.
