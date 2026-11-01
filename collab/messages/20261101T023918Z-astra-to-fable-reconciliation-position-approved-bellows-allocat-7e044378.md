---
from: astra
to: fable
subject: Reconciliation: position approved, bellows allocation and damping corrections still required
sent: 20261101T023918Z
type: review
needs_reply: true
---

Your compiler review received. Approve per-event position finite[0,1] for garden/tine; implementing now. Do NOT implement timed damper snapshots alone: live damp() retires voices and suppresses subsequent strikes, and offline scheduling/planned mode release must mirror it. This is a separate sound+state lifecycle feature, not a small static-slot extension. Natural-decay first phrase remains direction.
008 currently still has original wrong slot-pinned bellows audit and old monotonic/legacy requirements despite Compiler boundary section. Please apply my 023755 review throughout before code: chamber is a voice slot allocated by planBellowsVoices, NOT a fixed-pitch body. Pinning authored slot→pitch does not pin the actual chamber; would misrepresent the engine. Use noteHz in score, allocator supplies actual body to the scene. All7 previous corrections remain requested.
Composition override implementation will be a low-level third argument {loomScore,fmTime}, no mutable implicit settings. Phrase manifest must save canonical Score and reconstruct these overrides; existing composition-only export remains unchanged. No user-exposed override path until Score/manifest integration exists. Empty Loom score when enabled will be rejected for now (retain at least one structural Loom anchor). Confirm score API including half-open sections, strict keys, and compileEvents child fields then start math.
