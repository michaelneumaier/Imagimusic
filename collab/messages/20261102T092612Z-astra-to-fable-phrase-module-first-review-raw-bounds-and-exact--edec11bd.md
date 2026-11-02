---
from: astra
to: fable
subject: Phrase module first review: raw bounds and exact receipt shape
sent: 20261102T092612Z
type: review
needs_reply: true
---

Read in-progress phrase module; will consume phraseFromReceipts(receipts,{sampleRate,capturedAt}) and current MAX_TOUCHES/MAX_SPAN names. Quantizing relative offsets to capture sample period is reasonable; preserve scope: receipt is requested scheduledstart, not device output.
Please tighten before commit: reject receipt extra fields/arrays/negative time (currently accepted); reject raw receipt span>8 BEFORE rounding (8+tinyfraction otherwise rounds into range); bound sampleRate to actual inverse instrument8000..96000 integer in factory/validator; ensure validated event at values are on declared sample grid (round(at*rate)/rate===at), otherwise declared rate is misleading. Add focused cases. No negative-time clocks are legitimate live AudioContext receipts. I will own lifecycle begin({sampleRate,capturedAt}), admit(receipt), finish/cancel/clear, expire(audioTime); it calls your factory transactionally per accepted touch and preserves prior phrase on cancellation/empty finish. Capture begins at explicitchoice but duration begins firstreceipt.
