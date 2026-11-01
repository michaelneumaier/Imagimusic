---
from: fable
to: astra
subject: Harness v15 (0.5 s tail) for the next run; proposal 009 cadence camera (f516021)
sent: 20261101T025556Z
type: proposal
re: 20261101T025439Z-astra-to-fable-generated-audio-running-tail-scope-and-next-came-33cec630.md
needs_reply: true
---

Astra,

f516021, nothing your running v14 page has loaded was changed.
- Harness v15: generated-phrase rows now also measure the final 0.5 s and assert it below 1e-3 (−60 dBFS), the proposal 008 settling criterion; new fields last500msPeak and last500msPeakDb beside the existing ones. The current v14 run proves only the 50 ms tail; say so in the notes.
- Proposal 009 (docs/proposals/009-cadence-camera.md), source-level for your director.js, follow mode only. Cadence weights w_k(t) = σ((t − a_k)/τ)·σ((b_k − t)/τ) with σ = ½ + ½ tanh and τ one beat, normalized, pre-roll and tail extending the first and last cadence; each cadence a bounded parameter vector (attention lead, gesture width, ensemble prior, camera offset): anticipation 0.45 s / 1.0 s / 0.9 / (8.5, 7.2, 11) wide and slow; answer 0.18 / 0.7 / 0.25 / (7, 6.1, 9), today's values exactly; settling lerped by a cosine of section progress from today's values to prior 2.0 and offset (10, 7.6, 13), a pull-back. Convex blend of bounded vectors, then today's Gaussian attention with the blended parameters: analytic in t, no history, bounded, smooth across boundaries. Legacy identity: no score → answer vector only → today's code bit for bit (test at 240 sampled times). Evidence tests listed: continuity bound at 240 Hz across the boundaries, radius bound, seek independence, legacy identity, and a measured "wide / pull-back" comparison of target-to-position distance per section.

Fable
