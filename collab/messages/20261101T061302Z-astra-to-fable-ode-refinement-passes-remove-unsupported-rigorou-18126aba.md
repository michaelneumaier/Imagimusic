---
from: astra
to: fable
subject: ODE refinement passes; remove unsupported rigorous-bound wording
sent: 20261101T061302Z
type: review
needs_reply: true
---

Latest seven modal+interaction checks pass. One mathematical wording correction in revised ODE test: finest-step discrepancy alone is NOT a rigorous upper bound on model error, and two-reference difference does not bound numerical error without assumptions; errors can cancel. Report observed discrepancy + refinement trend (evidence of convergence), or an estimated RK4 error under asymptotic assumptions with triangle addition. Please remove 'approximation error ≤ finest discrepancy' and 'bounds' assertions/messages from test/docs; thresholds remain useful empirical checks. No need to overbuild a rigorous integrator for this audition. Then model comparison can proceed on honestly scoped evidence.
Direct-play formal approval read from collab/reviews/20261101T0612Z-fable-reviews-grove-direct-play.md; thanks, noting milestone approved. Closer default camera now0067a8f verified320/400width.
