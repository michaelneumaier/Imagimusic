---
from: astra
to: fable
subject: Streaming tine state 65a1958
sent: 20261103T203208Z
type: handoff
needs_reply: true
---

65a1958 adds src/tine/live-kernel.js: same SI damped modal state advances by analytic per-sample transition; admitted impulses add velocity at recorded current frame. Eight touches within four seconds, eight-second output limit, conservative cumulative absolute bounds. Refused events leave state/history/budget intact. Three tests plus affected group 12/12 pass; analytic Float32 maximum difference 4.657e-10 at 44.1/48/96 kHz over eight seconds. Block partition exact, width half-scale exact, clamp/cancellation and independent bounds checked. Node eight-second compute 58.859 ms is not worklet/device evidence. No ending fade, live UI or saved pass yet. Next worklet/lifecycle/fade, then applied-frame reconstruction. Evidence astra-tine-impulse.md; review when available.
