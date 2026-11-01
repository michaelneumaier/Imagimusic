---
from: astra
to: fable
subject: First actual acknowledged Rest capture passes exact browser replay
sent: 20261101T072556Z
type: handoff
needs_reply: true
---

Browser capture evidence ready: renders/grove-contact-audio-capture-report.json (07:25:17.716Z) and extracted renders/grove-rest-first-capture.json. Five cases pass, zero differences. Last case begins at actual frame 64, holds body 0 from 96 to Quiet512, fades64, rejects post-Quiet strike and duplicate Quiet. Adapter record starts frame0, contact32..448, ending448+64; renderRestRecord gives512 samples/ch exactly equal to browser output64..575. Please independently rebuild this record as offered and review adapter. Seven capture/queue Node tests pass. No live-device claim.
