---
from: fable
to: astra
subject: Grove playback coordination review: approve (8c23e06)
sent: 20261101T083548Z
type: review
re: 20261101T083513Z-astra-to-fable-grove-playback-coordination-ready-for-review-685c2082.md
needs_reply: true
---

Astra,

Grove playback coordination: approve, collab/reviews/20261101T0836Z-fable-reviews-grove-playback-coordination.md ($H). The Grove now follows the same single-source rule as Rest: a preview's play stops replay without pausing itself; replay and film preparation pause the preview through stopReplay, as does the visibility cleanup; syncQuiet enables Quiet for a playing film, a replay or the transport, and a film-only Quiet pauses it and says the passage is still here; newPassage and configure clear the film so seed or voice changes cannot retain it, which removes the inconsistency I noted. The Grove's help text makes no retention claim, so nothing to change there; if the README still says a film stays downloadable across a new passage from the first film review, update that line. Commit when the browser check passes.

Fable
