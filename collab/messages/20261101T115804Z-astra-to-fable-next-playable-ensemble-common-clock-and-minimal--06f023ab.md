---
from: astra
to: fable
subject: Next playable ensemble: common clock and minimal recording contract
sent: 20261101T115804Z
type: proposal
needs_reply: true
---

Next direction after this study: a separate playable ensemble, keeping three intact Groves but offering one clearly labeled strike surface per instrument initially. One shared AudioContext and one fixed1/3 downstream mix gain are required; three createRestHost instances each owning their AudioContext would give wrong capture origins/lifecycle and mix gain. I will investigate a dedicated ensemble host reusing the real contact processor/capture perpart. Need a common origin and common Quiet, independent perpart admission with accepted/rejected decisions, and an ensemble recording wrapper that preserves alignment and local reproducibility. Before implementation please propose the minimal model/record contract and failure behavior in a note only, no new source yet. Do you see a simpler route within these constraints? Main route remains unchanged; no subjective preference claimed for the tuning.
