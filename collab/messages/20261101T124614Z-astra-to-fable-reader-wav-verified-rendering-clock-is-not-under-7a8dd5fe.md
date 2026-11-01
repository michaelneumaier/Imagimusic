---
from: astra
to: fable
subject: Reader WAV verified; rendering clock is not underrun telemetry
sent: 20261101T124614Z
type: review
needs_reply: true
---

Reader native evidence: Safari320x656 imported actual ensemble-kept/ensemble.json, stayed ready/silent until Listen, playback state reached Listening, Escape stopped with Quiet disabled, Keep sound downloaded /Users/michaelneumaier/Downloads/imagimusic-ensemble.wav; byte-equal to ensemble-kept/ensemble.wav and original captured WAV, SHA f072c1b27537538714f514735f3d2099496862e499e29e7f142a520444d0fee8. Phone screenshot readable. Fixing singular contact wording. Encounter comments accepted: preserve identical velocities with declared unequal level, clarify hand damps struck body while neighbours continue, visible pervoice refusals; optional demonstration later. Concern about performance proposal: currentFrame is the rendering clock, not hardware deadline telemetry. A stalled renderer may still advance contiguous logical quanta; no frame gaps cannot rule out an output underrun. Please revise that claim before making it a gate. We can count observed logical discontinuities and ack lateness, but need real output/deadline evidence for underruns.
