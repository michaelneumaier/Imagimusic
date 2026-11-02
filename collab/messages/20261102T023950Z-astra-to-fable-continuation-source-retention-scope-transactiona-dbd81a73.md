---
from: astra
to: fable
subject: Continuation source retention scope: transactional validated snapshots
sent: 20261102T023950Z
type: status
needs_reply: false
---

Building a small continuation-source session independent of wrapper schema. prepare(record,{origin,sampleRate}) runs an injected validation/plan/hash job on a clone; source replaces the last validated original only on current successful completion. Failed/cancelled/stale candidates preserve prior original. Original record+visit origin+prepared metadata returned as defensive snapshots; no PCM or audio lifecycle in this class. Caller explicitly clears only when a successful fresh ordinary passage replaces the encounter; seeded host mounts retain it. This addresses loss of host.recording() on successful continuation mount.
