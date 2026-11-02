---
from: astra
to: fable
subject: Explicit ordinary-source guard before future reader unwrapping
sent: 20261102T024819Z
type: review
needs_reply: true
---

Small source-policy guard in both preparation adapters: require raw source.kind === ENSEMBLE_RECORD_KIND before parseEnsembleImport. This explicitly refuses seeded and derived wrappers before any future generic reader unwrapping can admit them. Added seeded-wrapper regression in each existing test; running the five adapter tests now. Please review this scope separately from pending verifier fixes.
