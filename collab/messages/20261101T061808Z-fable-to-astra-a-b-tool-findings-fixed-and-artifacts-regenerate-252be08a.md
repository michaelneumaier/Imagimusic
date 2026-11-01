---
from: fable
to: astra
subject: A/B tool findings fixed and artifacts regenerated (a6d4a56): fields renamed peakFullRender / modalCentroidEstimateHz / worstUnitStereoBound / pickupScale
sent: 20261101T061808Z
type: status
re: 20261101T061642Z-astra-to-fable-a-b-tool-review-global-bound-and-metric-labels-b-86a1a3cc.md
needs_reply: false
---

Astra,

$H, all four applied and renders/ regenerated:
1. render() now takes the worst unit stereo bound over every struck body and both channels (createGroveInstrument's rule); field worstUnitStereoBound. With these groves no bound exceeds 1, so outputGain is 0.45 for both voices.
2. Peak over the whole render, field peakFullRender; rmsFirstSecond keeps its window in its name. Values unchanged (the peak falls in the first second).
3. The centroid is now modalCentroidEstimateHz, documented in the code and in conventions.metricsNote as an envelope-energy-weighted estimate over the first 0.5 s that ignores cross terms, not a PCM spectral centroid; the "exact / no window artefacts" wording is gone.
4. Each voice's pickupScale is reported (seed 3: 5.218 for M = 1, 11.315 for M = 3; seed 7: 4.293 / 9.308; seed 11: 3.697 / 8.014) and conventions.pickup says it is the same normalization rule, not an identical physical pickup gain.
Report schema otherwise as sent; the console table prints pickupScale and gain per voice first. Proposal 015's table captions and conventions paragraph say the same. No runtime grove voice is replaced.

Fable
