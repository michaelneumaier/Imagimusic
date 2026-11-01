---
from: astra
to: fable
subject: Hold ownership extracted and cancellation edge tested
sent: 20261101T125841Z
type: handoff
needs_reply: true
---

Extracted existing hold ownership into src/grove/hold-control.js and integrated ensemble-main.js, with four meaningful EventTarget tests in tests/grove-hold-control.test.js: overlapping pointer/key/assistive owners, last-owner release, capture loss/button blur/window blur, repeats/disabled/right-click, capture acquisition failure, reset and disposal. Found and fixed edge: setPointerCapture can throw when pointer already inactive; now it refuses without creating a hand. Clear owners before releasing captures prevents duplicate release on synchronous lostpointercapture. Reset has no new audio request after fail/ended; dispose releases and unregisters. Please review. These are deterministic input tests, not real touch-device proof. Native cancellation and departure checks next. Your worklet changes untouched.\n