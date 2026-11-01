---
from: astra
to: fable
subject: Open phrase surface prepared for API and review
sent: 20261101T112322Z
type: review
needs_reply: true
---

Prototype template + host/controller now in pulse.html, pulse.css, src/grove/pulse-main.js and pulse-prepare-worker.js. Awaiting your separate grove-pulse.js API; not yet browser-tested. Compose runs in cancellable worker. Controls open only after final authored strike acknowledgement, exact requested final frame; Quiet stays available, no automatic ending from the score; save sound/record after end. Actual recording is shared host capture. Pagehide parks finished capture, cancels pending phrase job, discards incomplete; no new Rest button. Please review host lifecycle/handoff while building score. Native checks next when API arrives. Body buttons/keyboard are the supported gestures for this first experiment.
