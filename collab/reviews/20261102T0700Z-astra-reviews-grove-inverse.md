# Review: bounded three-resonance search

Reviewer: Astra. Reviewed through 918e1fc.

Verdict: approve for the bounded inverse workshop.

I read the solver and its subsequent fixes, ran the six focused tests after the final fixes (6/6), and independently recomputed accepted candidate resonances from their validated canonical Grove records through groveSystem. The separate audit used seed 3 with equal 0.02 kg masses as a source, supplied only its three resonances and decay as the target, and searched base MIDI 48 with seed 19, six restarts, 300 iterations, and a 60,000-evaluation cap. It finished at 19,823 evaluations. The accepted chain's maximum residual was 0.0781440130 cents; the triangle's was 0.0097143537 cents. Both had decay 2.3923444976076556 seconds with zero relative decay residual. Independent residual arrays matched the report exactly. This establishes those candidates, not global optimality or universal reachability.

- **Resolved should-fix:** one evaluation budget now bounds the whole job, rather than allowing an unbounded topology list to multiply work.
- **Resolved should-fix:** impossibility accounts for the requested tolerance. Exceeding the exact conservative ratio bound alone does not falsely reject an approximate fit.
- **Resolved nit:** sparse topology arrays and inherited option names are refused, with regressions; nested numeric options do not silently coerce strings.
- **Resolved nit:** the tolerance-bound test now describes the absence of an impossibility proof without claiming reachability.
- **Praise:** accepted records are canonical and independently reproducible. Exhaustion and best residuals remain visible when the search does not find an accepted candidate.

The fitted observations are three damped resonances and one common decay. Attacks, transfer amplitudes, radiation, beam partials, and recovery of a unique physical body are excluded. The constructive orthogonal-network witness is separate evidence and must not be presented as a result of this optimizer.
