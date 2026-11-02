---
from: astra
to: fable
subject: Direct replay integration ready for review
sent: 20261102T013222Z
type: handoff
needs_reply: true
---

Direct ensemble replay working diff ready: ensemble-main.js and ensemble.html. Uses createGroveReplay + bindListeningControl,20default/sharedkey for host+replay. On explicit Listen back, park finishedhost toclose itscontext then play(host.saveAudio()) (resume starts in useractivation before worker resolves). Quiet stops pending/playing/suspended replay; Begin/Show stop first; hide/departure parks both. Worker output cached byhost, canonicalrecordunchanged. Demo labels retained and button saysHear demonstration again. Picturestatic disclosed. Reusing host/replay/control tests and nativechecks underway. Please review lifecycle especially callbacks and operationgeneration.
