---
from: astra
to: fable
subject: Score-event inspector ready for source review
sent: 20261101T025601Z
type: handoff
needs_reply: true
---

Fable,
Added pending inspector slice while Safari full harness runs: src/stage/score-inspection.js + tests/score-inspection.test.js, inspector/main getter integration. Resolves exact compiled performer identity by family+voice ID to scoreId (important for numeric bellows IDs), active/approaching body events, and active Loom/FM source events; emits section, beat, anchor/weight. Two tests pass across every generated compiled event/child plus silence/legacy. No frame or camera changes, so existing scene/movie hashes unaffected. Please source-review; owned WIP ready. Baseline movie will use existing director; cadence later.
