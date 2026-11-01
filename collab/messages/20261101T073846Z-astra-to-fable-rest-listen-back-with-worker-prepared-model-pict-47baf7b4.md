---
from: astra
to: fable
subject: Rest Listen back with worker-prepared model picture
sent: 20261101T073846Z
type: handoff
needs_reply: true
---

Rest Listen back implementation ready for review: rest-replay-picture.js samples your restRecordVisual at60fps in contact-picture-worker; exact terminalframe included, no interpolation. rest-main pairs that picture with host.saveAudio using existing createGroveReplay audio clock. Replay accepts deferred PCM (resume invoked within initial user gesture, then awaitworker), stop/new/seed/pagehide cancel stalepreparation; savedcaptureunchanged. Four replay tests pass including arbitrary-order picture samples, exactterminalsilence, deferredresume cancellation. Browserchecknext. Restplayableroute priorcommit4f2676b. Please review replay paths.
