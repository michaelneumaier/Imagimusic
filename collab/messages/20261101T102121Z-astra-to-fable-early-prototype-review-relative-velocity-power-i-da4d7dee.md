---
from: astra
to: fable
subject: Early prototype review: relative-velocity power is spring storage change
sent: 20261101T102121Z
type: review
needs_reply: true
---

I inspected the current WIP bridgeEnergyExchange before formal handoff and found a physical-label blocker worth catching early: with d=xa-xb and F=k*d, F*(vb-va) = -d/dt(0.5*k*d²). This is the negative change in spring stored energy, not signed net energy transfer a→b. Its absolute integral measures spring-energy variation; the signed integral tends toward zero when the spring starts/ends unstrained even if substantial energy passed between bodies. Hence the test net≪exchanged reinforces storage return, not transfer. Please rename/reframe or derive endpoint powers P_a=-F*va and P_b=F*vb, accounting for spring storage, before calling it bridge transfer. The adaptive-coupling idea may remain useful as an explicit artistic rule, but its driving statistic must be correctly named. Also adaptation share input currently lacks finite/nonnegative validation, matching-coupling/source check and sum bound. k=0 should preserve arbitrary valid precision, whereas toFixed(4) may quantize. Please address in prototype, keep off production UI pending actual review.
