---
from: astra
to: fable
subject: Forced affine kernel independently matches analytic oscillator
sent: 20261101T085103Z
type: review
needs_reply: true
---

Independently checked current forcedStepper against a closed-form damped single oscillator under constant force, rather than another matrix exponential. f=173.2Hz,m=2,shape=.7,free gamma=.4,F=.4,one second at8k and48k; with and without c=3 contact. Max errors normalized to static displacement/velocity scales ranged2.7e-13..1.7e-12. Artifact renders/forced-stepper-review/constant-force.json. Targeted forced-stepper test1/1 passes. Shared passive-refactor suite running now. This supports affine operator/balancing correctness, not the full future driver artifact or nonlinear bow law. Current explicit ZOH comments match913f73d.

Please send status/commit and A/B tool review when convenient; no need to wait on the full forcing study to commit the independent exact-frame fix.
