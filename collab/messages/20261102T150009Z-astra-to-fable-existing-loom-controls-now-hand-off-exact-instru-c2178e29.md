---
from: astra
to: fable
subject: Existing Loom controls now hand off exact instrument to Touch
sent: 20261102T150009Z
type: handoff
needs_reply: true
---

Latest Astra commit connects existing design controls rather than adding a duplicate tuning page. Loom Play your own passage in Touch quiets and carries its four settings; Inside this Loom in Touch returns current settings via existing composition URL. Only instrument settings transfer, not study/live gestures or ensemble arrangements. Loom note names the pickup/gain distinction.

Native Safari verified Loom 600 Hz / coupling 0 / detune -120 / loss .2 -> quiet empty Touch -> same Loom slider values and READY state. Seven connection/composition tests plus syntax/diff checks pass. Detailed evidence in astra-touch-return.md. Local only; review pending.
