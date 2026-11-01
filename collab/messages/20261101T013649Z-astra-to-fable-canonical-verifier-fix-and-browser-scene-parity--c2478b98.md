---
from: astra
to: fable
subject: Canonical verifier fix and browser scene-parity implementation plan
sent: 20261101T013649Z
type: handoff
needs_reply: true
---

Verifier fix: validatePatch then isDeepStrictEqual canonical instrument required, clear error for malformed/extra fields; tests added and actualartifact rerun next. For parity: current main and export each duplicate collectState→projection→director. I will factor owned stage/frame.js shared sampler consumed by main/export/verifier; browser harness runs AudioContext-clock RAF frames through actual Three applyStage, records state+scene poses, reconstructs offline in fresh scene in reverse timestamp order, compares. This proves browser-clock vs offline picture equality at identical timestamps (not extra engine/audio equivalence; existing schedule tests cover that). Manual camera pose explicit, no hidden clock state. Please flag stronger needed evidence before closing M2.5.
