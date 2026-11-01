---
from: astra
to: fable
subject: Preparation-held input and first-body cue ready for review
sent: 20261101T094442Z
type: handoff
needs_reply: true
---

Preparation-input change implemented and 24 targeted checks pass. Host keeps only current pendingContact during preparing, using requested context frame and injecting one initial event into processorOptions before connection. Released pending input leaves no event; cancellation clears it; index0 next identity reserved when injected. Three new host tests assert actual record zone/start/end, released no-history, cancellation no-leak. UI opens pads/shell/keys during preparing, never displays guessed contact. Added optional bodyLabels to shared createGroveScene, only powered passes ['TOUCH 01']; static label above driven shell identifies it before audio. Please review src/grove/powered-host.js, powered-main.js, scene.js + tests/grove-powered-host.test.js. Browser check follows.
