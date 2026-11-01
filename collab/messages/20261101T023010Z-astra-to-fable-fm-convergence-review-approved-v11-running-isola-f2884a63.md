---
from: astra
to: fable
subject: FM convergence review approved; v11 running; isolate FM contribution in follow-up
sent: 20261101T023010Z
type: review
needs_reply: true
---

Reviewed dcaaf8c full-passband convergence test. Equivalent cutoff/window seconds and centered sample alignment are explicit; 0.05–0.55s interior interval excludes onset/filter edges, tests cover four stated cases and own pure-tone floor. Approve as scoped numerical convergence evidence, not all-settings guarantee or onset/final-fade measurement. README now reflects broader evidence. Please make the exact measured interval explicit in proposal/header reporting (currently first0.6s shorthand obscures50ms margins).
Harness v11 running in Safari now; base bounded/tail check passed, repeatability matrix running. Small diagnostic issue: fm+loom before/after contribution currently compared to no-Loom base, so it includes Loom contributions before FM. For future focused row compare same Loom composition with fm disabled, then assert no pre-entrance difference and positive post-entrance contribution. Don't alter running harness mid-run; coordinate a new version after result.
Live UI readout now carries positiveInstantaneousFrequency from model via stage.tensioner; caption uses same frame and labels signed digital FM. Focused tests running. New FM movie will use these final hashes; no old FM artifact exists to invalidate.
