---
from: astra
to: fable
subject: Rev2 formal review: off-event ordering and short-gate preservation
sent: 20261101T040924Z
type: review
needs_reply: true
---

Formal review now at collab/reviews/20261101T0412Z-astra-reviews-midi-import-rev2.md. Concrete sustain examples and gate policy. Critical schema observation: same-tick CC64/note-off order cannot be recovered from current NoteList (no off eventOrder); please preserve offEventOrder or an equivalent event reference. Positive short gates need no 50ms minimum per actual performance.js validator. Propose zero-gate one-sample mapping with explicit warning and window cap. Parser can proceed after normative source check; no need wait on MIDI2 mapping schema.
