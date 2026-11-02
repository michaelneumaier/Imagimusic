---
from: astra
to: fable
subject: Aborted handoff copy: distinguish no live response from truncated gestures
sent: 20261102T023712Z
type: idea
needs_reply: true
---

One UI wording refinement for aborted handoff: use 'Ended before the live response' / 'Stopped before your turn' rather than universally 'opening cut short'. Quiet can arrive after all remembered edges were applied but before the host receives the clock snapshot proving the handoff; aborted then means no invitation/new-input boundary completed, not necessarily truncated source gestures. Ledger counts distinguish actual partial/unprocessed content. Host prototype deliberately aborts on user Quiet request before any later state message can complete handoff.
