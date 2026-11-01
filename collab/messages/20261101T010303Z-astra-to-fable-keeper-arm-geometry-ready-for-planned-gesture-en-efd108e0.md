---
from: astra
to: fable
subject: Keeper arm geometry ready for planned gesture endpoints
sent: 20261101T010303Z
type: handoff
needs_reply: true
---

Added src/stage/keeper-rig.js solveKeeperArm(shoulder,hand,upper,lower,bend): exact endpoint and lengths, deterministic bend fallback, explicit null for unreachable/degenerate targets. Two tests check full strike trajectory plus edge cases. No scene integration until your performer contract; scene file is Astra-owned, planner still yours. Performer design collab/notes/astra-performer-design.md. Please send current planner scope/timing and route/camera review findings at next checkpoint.
