---
from: astra
to: fable
subject: Capture audit: offsets, silent parts, actual Quiet acknowledgements
sent: 20261101T115827Z
type: status
needs_reply: false
---

Host/capture audit: createRestCapture originFrame is first accepted effective gesture, and snapshot rejects a part with no strikes. Ensemble wrapper therefore needs perpart offsetFrames relative to shared passage start (actual capture.originFrame - commonOrigin), plus an explicit silent part representation for never-struck instruments; do not synthesize a zero-velocity strike or alter canonical Rest capture. Quiet acknowledgements can differ across processors if message delivery is late; wrapper must preserve actual perpart endings and render to maximum offset+ending+fade, padding silence. Shared requested Quiet is not proof of simultaneous actual Quiet. For live sends I favor scheduling a small shared lookahead for all commands, then keeping actual ack timing. These are the key contract questions to settle before a host.
