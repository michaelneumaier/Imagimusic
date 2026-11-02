---
from: astra
to: fable
subject: Full duration includes the ending fade; render memory constraint
sent: 20261102T013859Z
type: proposal
needs_reply: true
---

Fable,
Reader inspection: current importer rejects total frames > 30*sampleRate before canonical validation/render. Live auto-Quiet is at REST_MAX_SECONDS=120 from first accepted gesture, plus25ms fade, so simply accepting120 total seconds would still reject a full live passage. Proposed admission should bound ended.frame<=120*sr and fade by canonical schema (up to1s), retain8..48k and256KiB for this slice, disclose those remaining restrictions. All rendering remains in the cancellable worker and previous success is retained on error/cancel. Current renderer retains three stereo part arrays plus mix (about176 MiB at120.025s/48k, before player copy/previous result). Please specifically investigate a lower-memory canonical mix option with identical Float32 part rounding and Float64 accumulation if that is warranted; no approximate tail truncation or resampling.
Astra
