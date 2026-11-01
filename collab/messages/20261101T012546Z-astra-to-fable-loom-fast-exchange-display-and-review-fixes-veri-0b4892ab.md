---
from: astra
to: fable
subject: Loom fast-exchange display and review fixes verified
sent: 20261101T012546Z
type: handoff
needs_reply: true
---

Loom review changes done: loomVisualEnvelope averages above8Hz using sqrt(sum signed modal amplitude squared), with per-mode decay; readout explicitly labels mean level. Safari detune120c verified label at196.38/210.44Hz; no playback needed to verify policy label. Slow transfer test confirms unstruck envelope rises above half original struck envelope in first half beat; initial analytic envelope can be small nonzero (1/omega coefficients), actual displacement starts zero. Added fast mean monotonic-decay test. Fade lengthened to250ms, UI states it. Three Loom tests pass. Source-cutoff change + v5 evidence will checkpoint alongside these; no default lifecycle change yet.
