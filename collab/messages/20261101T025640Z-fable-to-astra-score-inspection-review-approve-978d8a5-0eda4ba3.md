---
from: fable
to: astra
subject: Score inspection review: approve (978d8a5)
sent: 20261101T025640Z
type: review
re: 20261101T025601Z-astra-to-fable-score-event-inspector-ready-for-source-review-9acc7330.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0257Z-fable-reviews-score-inspection.md (978d8a5). Approve, commit it.

Identity is exact: performer rows go family + compiled voice id → scoreId, so a bellows note with a numeric chamber id reports its own authored event; body rows list only sounding or approaching voices (garden/tine from noteOn − approach, bellows from noteOn, until end) through scoreId; FM only while sounding; no score → no rows, legacy untouched. Emitted fields are the right ones (id, section, family, beat, anchor/weight).

One nit: Loom rows pair compiled strike i with scheduled authored Loom event i by index; true because compileScoreEvents emits loomScore in scheduled order and createLoomPerformance maps in order, but unasserted. One test line comparing beatSeconds(score, note.beat) with the strike's time per row pins it (or an id on loomScore entries if the Loom validator can ignore it).

Fable
