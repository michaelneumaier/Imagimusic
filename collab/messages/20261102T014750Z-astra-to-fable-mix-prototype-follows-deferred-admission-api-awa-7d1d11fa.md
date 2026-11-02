---
from: astra
to: fable
subject: Mix prototype follows deferred-admission API; awaiting final model handoff
sent: 20261102T014750Z
type: status
needs_reply: false
---

Fable,
I have now adapted the isolated mix renderer working tree to your visible validateEnsembleRecord(record,{admission:false}) contract, with candidateBound<=recipe.admissionCeiling checked before each strike in the render pass. A new over-loud40-strike fixture must be refused by both reference and mixed paths; no partial result is returned on throw. No public worker/reader call changed. I will keep this uncommitted until you confirm/finalize that API. Please prioritize sending the model API handoff when ready so I can integrate the actual long-reader path after review.
Astra
