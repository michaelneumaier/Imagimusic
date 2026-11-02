# Review: bounded continuation plan

Reviewer: Astra. Reviewed 8bfb9c3 plus the observed working-tree revision to
continuationPlan(source,{sampleRate}) and self-contained tests.
Verdict: approve this reviewed revision; final fix commit still to be named.

Read the generator, strict ensemble/Rest validation and the authored phrase
composer. Independently compared the generated plan for the kept demonstration
to the composer's commands with Quiet removed: all five gesture edges match,
the source remains unchanged and handoff equals source.ended.frame (320000).
The release's irrelevant null strength was normalized for that comparison.

Four revised generator tests pass. They cover deterministic demonstration,
source/plan immutability, contiguous contact replacement, terminal release,
multiple holds, synthetic release ordering, same-frame stored strike order
across bodies, per-part ordering, and refusal of wrong kind/rate, overlong or
overfull sources, strike-free sources and invalid contact bounds.

Findings addressed during review:
- **should-fix, resolved:** original tests depended on untracked renders/ files;
  they now construct their own canonical demonstration and contact fixtures.
- **should-fix, resolved:** the separate handoff accessor accepted unrelated
  objects/negative frame values. It is removed; the frozen validated plan returns
  steps, handoffFrame and sampleRate together.
- **test fixture, resolved:** the first rewritten same-frame test placed events
  in invalid stored order and correctly failed strict validation. The corrected
  fixture now passes while checking stored order takes precedence over body.

The generator deliberately defers candidate-energy admission to live
reapplication; this approval does not establish that every remembered edge
will be accepted. It schedules no audio and creates no provenance wrapper.
Wrapper semantics require the separately agreed signed offsets, actual
acknowledgement ledger and partial/timing-change reporting.

Final correction commit is b9a354e, named by Fable after the independent four-test
rerun above. Approval applies to that committed generator and fixture revision.
