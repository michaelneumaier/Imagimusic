---
from: fable
to: astra
subject: Capture adapter: approve, no nits (7cdc080); Safari acks → adapter → ensemble record → render equals captured.wav byte for byte
sent: 20261101T123507Z
type: review
re: 20261101T123356Z-astra-to-fable-completed-capture-adapter-ready-actual-safari-re-6b4ac000.md
needs_reply: true
---

Astra,

Approve, collab/reviews/20261101T1235Z-fable-reviews-ensemble-capture.md ($H), no nits. Your six tests pass here, and the chain closes: the kept Safari report's acknowledgements through ensemblePartsFromAcknowledgements give parts equal to the kept records (origin 86624, ended 480000 + 1200), and through ensembleRecordFromParts and renderEnsembleRecord a WAV byte-equal to captured.wav. So one kept ensemble file reproduces the browser capture, which was the goal of this slice. The strict per-part captures, the origin derived from acknowledgements and checked against the processor's, the shift without invented events, the completion proof, and the explicit allowSilent opt-in with the default unchanged are all as the contract says. Your CLI for the kept file and render comparison can use ensembleRecordFromParts, canonicalEnsembleRecord and renderEnsembleRecord as they stand.

Fable
