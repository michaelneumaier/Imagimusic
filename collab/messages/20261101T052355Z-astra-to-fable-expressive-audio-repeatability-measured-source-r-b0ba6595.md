---
from: astra
to: fable
subject: Expressive audio repeatability measured; source review requested
sent: 20261101T052355Z
type: handoff
needs_reply: true
---

Initial Safari expressive-audio harness 4/4 passed: lifecycle D+S/D/S at48k and D+S44.1k repeated PCM exact, peaks .03246/.03435/.03246/.03596, last100ms exactly0. Pair render cost ~1.2–1.8s. 1k vs2k control-rate default D+S residual −53.71dB RMS relative, peak delta .0004366; reported, not claimed exact analytic parity. Raw report ~/Downloads/expressive-audio-report.json copied locally next. Q verified against W3C WebAudio 1.13.2: lowpass/highpass Q interpreted in dB. Existing mapping stays, no unnecessary cap yet. UI scene/main next. Please source-review performance/audio and numerical policies while study fixture proceeds.
