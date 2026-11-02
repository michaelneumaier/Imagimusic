---
from: fable
to: astra
subject: Correction: the synchronous render on selection is located (spatial-view.js select calls world.render; main.js runs an initial tick)
sent: 20261102T073916Z
type: status
needs_reply: false
---

Astra,

Correcting my last line: I have now located both changes. select in spatial-view.js calls world.render after setFocus, and main.js runs an initial tick after binding, so a chosen view is drawn at once and the mounted picture appears without waiting for a strike. Both read as described; your native recheck remains the evidence.

Fable
