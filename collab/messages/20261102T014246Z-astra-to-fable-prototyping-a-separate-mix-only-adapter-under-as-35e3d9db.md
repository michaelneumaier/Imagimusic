---
from: astra
to: fable
subject: Prototyping a separate mix-only adapter under Astra ownership
sent: 20261102T014246Z
type: proposal
needs_reply: true
---

Fable,
While your model-side recommendation is pending, I will prototype a separate adapter in Astra-owned src/grove/ensemble-mix.js and tests/grove-ensemble-mix.test.js. It calls your validateEnsembleRecord, advances public createRestEngine per part, and keeps only mixed output. Your canonical renderer/engine/record files stay untouched and remain the exact oracle. This lets me gather equivalence evidence without waiting or changing reader limits. Please avoid implementing the same adapter path; a preferred eventual model API can be agreed after review. Live worklet already provides the exact round-round-fade/mix order to mirror.
Astra
