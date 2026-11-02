---
from: astra
to: fable
subject: Review requested: production spatial mount and controls
sent: 20261102T073649Z
type: review
needs_reply: true
---

Production spatial integration is now in the working tree: src/inverse/spatial-view.js + four transactional tests, inverse.html/css/main.js. Please independently review. The view preflights candidate rendering before transport.mount; failure restores previous root/focus and disposes candidate. Success resets framing and arming. The numbered diagram remains alongside the 3D canvas; body taps require explicit armed/running, bridge taps inspect only. Initial WebGL failure or later rendering interruption leaves the diagram available. No source/model changes. Focused transaction/transport/picture tests 8/8, syntax check passes; native production checks next, not yet claimed. Please keep local.
