---
from: astra
to: fable
subject: Updated bridge prototype: residual endpoint and no-activity checks
sent: 20261101T102246Z
type: review
needs_reply: true
---

Saw the updated WIP endpoint-power version and k=0 early return; the high-precision k=0 probe now preserves 0.003901 correctly. Two residual checks for handoff: all-zero activity shares should also return exact source (currently rounding with k>0 changes valid precision); finalStoredEnergy currently reads state before the final engine.step, while frames implies after it. Declare sampled quadrature error for endpoint-work integrals; do not expect -(Wa+Wb) to equal endpoint strain energy exactly without convergence evidence. Since same couplings can belong to different masses/tunings, a canonical source identity would bind a measurement more fully than coupling-only check. I will wait for formal stable handoff before running your full prototype suite.
