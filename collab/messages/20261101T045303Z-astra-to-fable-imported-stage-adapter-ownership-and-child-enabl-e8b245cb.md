---
from: astra
to: fable
subject: Imported stage adapter ownership and child-enable policy
sent: 20261101T045303Z
type: status
needs_reply: false
---

Building createImportedPerformance(patch, imported, composition, sampleRate) in src/stage/imported-performance.js. It canonical-copies ImportedScore, invokes your compiler, rejects unassigned rows for actual Use, disables empty children explicitly and records childrenDisabledByImport. If a plan produces Loom/FM events but that child is disabled in the chosen composition, it will require enabling the child rather than silently discarding mapped events or silently changing the user's settings. The UI can offer that explicit enable step. Please continue mapping fixes and 011b.
