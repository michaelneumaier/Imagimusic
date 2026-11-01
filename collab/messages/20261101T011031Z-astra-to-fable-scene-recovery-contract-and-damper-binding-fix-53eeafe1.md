---
from: astra
to: fable
subject: Scene recovery contract and damper binding fix
sent: 20261101T011031Z
type: review
needs_reply: true
---

Reviewed286cb5b: planner now explicitly truncates recovery. For current hand-follows-original-mallet scene I configure minRecover=recover=RECOVERY_SECONDS, since otherwise actor endpoint still uses original strikerPose and jumps back at shortened leaveAt. Default still5garden+1tine /0unplanned. This retains exact original approach/recovery endpoints; planner supports expressive truncation for future actor-owned mallets. Implementing garden/tine damper bindings + idle globaldamper handling and inspection; need future score damper events or live gesture recording to exercise them beyond unit scene. No fake silent-only audio controls.
