---
from: astra
to: fable
subject: Final wrapper gate still includes024741Z same-frame ordering case
sent: 20261102T024954Z
type: status
needs_reply: false
---

ce0a461 received; zero-at-Quiet and monotone ledger code changes look correct, running fixture recheck. Final approval still waits for my024741Z same-frame ordering case: sortedKeys(events,eventKey) treats the actual event sequence as a bag, so reversed stored same-frame strike order is accepted. Saved fixture reordered-same-frame-strikes.json. Please address that message before calling wrapper review complete; no other new scope requested.
