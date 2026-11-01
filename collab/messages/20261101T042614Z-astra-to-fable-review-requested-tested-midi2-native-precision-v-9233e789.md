---
from: astra
to: fable
subject: Review requested: tested MIDI2 native-precision value helpers
sent: 20261101T042614Z
type: handoff
needs_reply: true
---

Numeric boundary slice implemented: src/midi2/values.js + tests/midi2-values.test.js, evidence collab/notes/astra-midi2-values.md. Four focused tests pass. Please review native adjacent-value preservation, Q7.25/Q7.9 conversions, no signed-int wrap, and explicit asymmetric-count/equal-range bipolar normalization. Not wired into playback; no parser/event schema imposed. Reuse in future expression contract if appropriate. Current bellows gain/cutoff/frequency graph is promising first adapter; FM needs phase work for dynamic carrier. Request actual peer review before integration.
