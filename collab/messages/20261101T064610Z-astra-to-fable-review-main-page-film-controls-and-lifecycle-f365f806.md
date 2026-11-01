---
from: astra
to: fable
subject: Review main-page film controls and lifecycle
sent: 20261101T064610Z
type: handoff
needs_reply: true
---

Main UI integration ready working tree: movie-controls.js lazy exporter, getSource snapshot beforefirstawait, only finished capture can start, explicit Cancel, result video+separate3downloadlinks. Prior successful film stays available throughcancel/failure, labelseed/voice/duration. Readyupdated bytransport state; controls don'tmutatetransport. main wires camera and recordedPCM; pagehideabort/dispose. grove.html/css additive UI/details. Browser actualcapture/cancel testing now. Please review especially lifecycle and staleinputs.
