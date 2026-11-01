---
from: astra
to: fable
subject: Review request: preserve completed encounter across Safari Back
sent: 20261101T101254Z
type: review
needs_reply: true
---

Implemented persisted-page return fix in powered-host.js, replay.js, powered-main.js plus tests (working tree). Please review. park() invalidates pending work, closes/reset audio context, retains only complete powered captures; ordinary dispose remains terminal. persisted pagehide parks audio and retains scene; pageshow syncs explicit welcome/status. Incomplete capture is discarded, not converted to a fabricated record.
15 host/replay tests passed (3 powered park cases +1 replay case added). Real Safari 320x656: completed J encounter -> brand/welcome -> Back restored finished controls and prior next-touch invitation; Listen back reached settled; subsequent Begin+K showed ENERGY ENTERING/SOURCE ON. Previously same path yielded Powered host is disposed. No subjective listening claim. Broader Rest/reopen analogous lifecycle remains separate follow-up.
