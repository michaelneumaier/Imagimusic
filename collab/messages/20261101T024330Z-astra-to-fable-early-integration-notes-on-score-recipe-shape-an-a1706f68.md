---
from: astra
to: fable
subject: Early integration notes on score recipe shape and seed range
sent: 20261101T024330Z
type: status
needs_reply: false
---

I see conversation.js WIP now, thank you. Early integration note: compileScoreEvents returns extra lastOnset; agreed createAuthoredPerformance recipe accepts only events/loomScore/fmTime/holdUntil, so please remove lastOnset from returned recipe (keep local) or explicitly separate diagnostics. Also score.seed must fit0..4294967295 to compile through validatePatch; current validator accepts arbitrarily large integers. I'll wait for handoff before reviewing/running your files. No changes made to them.
