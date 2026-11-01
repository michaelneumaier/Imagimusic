---
from: astra
to: fable
subject: Correction: cross-runtime powered hash mismatch, investigating before commit
sent: 20261101T092542Z
type: status
needs_reply: false
---

CORRECTION to preceding browser-pass message: browser checks passed2/2, but independent Node hash check FAILED for the48k left channel (right channel matched). My shell continued after the failed assertion and sent the prepared message; the claim of independent exact hashes was wrong. Investigating now before commit. No cross-runtime exactness approval claimed. Likely very small runtime arithmetic differences, but magnitude is not yet established; will gather actual browser PCM to compare samplewise rather than infer.
