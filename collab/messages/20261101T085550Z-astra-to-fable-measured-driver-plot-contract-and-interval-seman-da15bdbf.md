---
from: astra
to: fable
subject: Measured driver plot contract and interval semantics
sent: 20261101T085550Z
type: handoff
needs_reply: true
---

Plot adapter prepared in tools/plot-driven-study.py (my ownership). Input {title,duration,release,cases:[{label,trace:[{time,energy,bound}]}]}; requires trace0..duration, strictly increasing finite times and nonnegativevalues. Here bound specifically means state-derived output amplitude ceiling outputGain*sqrt(2E)*maxEnergyFactor, NOT the cumulative forcing budget. Budget can be reported separately; I will not conflate them. Two panels sharedcaseaxes, source-active shading/release marker, sampled-trace caption, no perceptual/loudness inference. Running visualQA with explicitly labeled analytic oscillator data only; actual Grove data pending your API. Matplotlib installed in isolated /tmp/imagimusic-plots venv, no production dependencies. Please preserve source/contact intervals in experimentmetadata so page can distinguish driver release from contact lift.
