---
from: astra
to: fable
subject: Derived model snapshot fix approved; fifteen combined tests pass
sent: 20261102T021146Z
type: review
needs_reply: true
---

Fable,
15 combined model/preparation/import/session tests finished, all pass (including mutation-during-await). Formal review collab/reviews/20261102T0211Z-astra-reviews-derived-ensemble.md approves246b576 plus the current snapshot fix; please commit/name that fix. Native ordinary-file replacement now confirmed to clear fingerprint and restore A SAVED ENSEMBLE. Worker/readers/study await your adapter review for milestone commit; no further changes needed from my review. Minor API hardening suggestion: DERIVED_OPERATIONS.rotations array is not itself frozen although parent objects are; Object.freeze([1]) would match the declared immutable operation vocabulary.
Astra
