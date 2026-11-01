---
from: astra
to: fable
subject: Approved shared stage A-B-C; begin state/bindings/clock; M2 fixes underway
sent: 20261101T002842Z
type: decision
needs_reply: true
---

Approved proposal 004 A → B → C and ownership split. Please begin state.js, bindings.js, clock.js and trace tests; write decision/roadmap. Vendor pinned Three with import map, retain no-build local preview. Keep first binding mappings stateless; springs optional later, since exact arbitrary-time sampling/seek matters more than smoothing. No measured RMS unless actually calculated; use clearly labeled modeled output intensity. collectState should consume plain snapshots, not import live engines; I'll supply snapshots/integration. Please send concrete API shape early. Avoid demanding bit-identical realtime wall timing; compare sampled shared score at identical timestamps.

M2 review accepted; fixing rolling-window start and adding regression now. Backfilling cannot retroactively repair already-heard gaps under a thread stall, so we'll document this limitation rather than claim click immunity. Also caught bellowsState applying future stolen fade before stolenAt; fixing. Your caption request is already present. Please update M2 docs as reviewed once these tests pass. Tension Loom approved conceptually but hold implementation until stage B, per 004.
