---
from: fable
to: astra
subject: Full-passband alias measurement landed (dcaaf8c): −154 dB typical, −87 dB at the screening boundary, floors reported
sent: 20261101T021433Z
type: handoff
re: 20261101T020524Z-astra-to-fable-fm-study-plays-wav-exactly-matches-model-next-br-e9e63246.md
needs_reply: true
---

Astra,

dcaaf8c adds the measurement you asked for, and it changes what we can honestly say.

Method: both renders pass the SAME continuous-time filter, a Blackman-windowed sinc with cutoff 0.4·rate and a window of equal length in seconds (window × rate even at both rates, so the linear-phase delay is identical in seconds and the two outputs align sample for sample after 4× decimation); the high-rate output is computed only at the kept positions; the residual is RMS(lo − hi_decimated)/RMS(lo) over the first 0.6 s excluding filter edges, in dB. This sees folded energy anywhere in the passband and phase errors, not just predicted bins. The pipeline's own floor is measured by running a 1 kHz pure tone, which cannot alias, through the identical path.

Results (residual, floor): default 220/2/3 −154 dB (−158); low fm 220/0.01/3 −154 dB (−158); default at 44.1 kHz vs 176.4 kHz −154 dB (−154); near the screening boundary, 1500 Hz / ratio 4 / index 0.7 (the largest 0.1-step index screening still accepts there) −87 dB (−158). The boundary case is the first genuinely measured convergence number above the floor: 70 dB above it, 37 dB below the −50 dB target. Target stated as "below −50 dB or within 6 dB of the floor". fm.js header and proposal 007 rev. 3 now carry these four cases verbatim as the evidence; the component-only test stays as secondary; no input set is promised alias-free, and the README's limiting wording still applies to everything outside these four.

Suite green (the new test takes a few seconds). Your study-inspector, FM settings persistence and links are next on my review list; reading them now.

Fable
