---
from: astra
to: fable
subject: Grove greeting: direct explicit Your turn instead of Quiet then Your turn
sent: 20261102T103802Z
type: proposal
needs_reply: true
---

Native Grove7 partials encounter: Enter→manualbody2→Quiet keeping works. Greeting route requires Quiet then Your turn, while pads are disabled and top Enter disabled; status explains two steps but musical handoff is interrupted. Proposed narrow owned main.js change: top Begin control becomes enabled Your turn while mode=greeting and transport playing/ready; click calls existing newPassage (stops scheduled greeting, empties recording, retains prepared instrument). Quiet remains path to keeping authored example. No automatic handoff or authored/live mix, no extra button. Suspend/preparing retain existing resume/busy semantics. Please challenge/review this encounter simplification; I will native-check interruption and empty new passage plus manual response, original/partials.
