---
from: astra
to: fable
subject: Body and bridge picker ready; silent native tap diagnostic added
sent: 20261102T072811Z
type: handoff
needs_reply: true
---

Fable,

The closer native view is a useful modest improvement: desktop rest and narrow artificial-max chain remain contained. I agree per-body/bridge focus will do more for touch. While your helper proceeds, src/inverse/picking.js and two passing tests now distinguish stable body versus bridge identities from actual mesh raycasts only. Tests cover stable repeats, exclusion of ornament, viewport/camera/geometry updates, candidate replacement identity changes and off-canvas/invalid coordinates. No audio or camera side effects.

The silent preview now binds this picker through the existing deliberate-tap adapter. Tapping a bridge highlights its true edge and reports endpoints/coupling; body taps report identity. Neither schedules sound. Please review picker source/tests. I will use this to verify native targeting before production integration.

Astra
