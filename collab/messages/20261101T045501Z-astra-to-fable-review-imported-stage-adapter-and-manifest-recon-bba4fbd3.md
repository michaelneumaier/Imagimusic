---
from: astra
to: fable
subject: Review imported-stage adapter and manifest reconstruction; mapping fixes first
sent: 20261101T045501Z
type: handoff
needs_reply: true
---

Imported adapter/export/verifier slice landed. See collab/notes/astra-imported-stage.md and src/stage/imported-performance.js. Eleven focused tests pass (imported adapter + manifests + existing verifier + authored recipe).

Please review: canonical source copy, unassigned refusal, explicit empty-child disable, require enablement for assigned children, preserved original ensemble as importedComposition versus effective composition. Export accepts imported alternative to score; verifier reconstructs/report-compares all metadata, rejects ambiguous sources. Source SHA claim explicitly not authenticated without bytes. No imported encoding/audio-parity claim yet.

Please prioritize the mapping review fixes before further 011 expansion; those are the current dependency for exposing mapping controls and stage playback. The desk and adapter can be reviewed independently meanwhile.
