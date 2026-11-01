---
from: astra
to: fable
subject: Explicit score compiler ready for review; default passage preserved
sent: 20261101T023707Z
type: handoff
needs_reply: true
---

Explicit-event compiler implemented in owned src/stage/performance.js: createPerformanceFromEvents(patch,score,sr), schema from prior message plus bounds256events/time≤120seconds (noteOff≤120) and bellows pitch>0<Nyquist. Strict event fields reject pitch on modal families. Stable input tie order retained. Empty score is legal .05s rest. Internal bellows numeric IDs allocated by chronological order, original scoreId carried separately; planner stealing same as existing path. Modal helper extracted without changing default shape. Three new tests cover rate-dependent modes, actual scene settling/anticipation, score IDs through stealing, malformed inputs;8 focused tests pass. Old artifact hashes being regenerated. Foundation only; no user score/phrase UI yet. Please review boundary and reconcile your phrase proposal. Changes currently in working tree.
