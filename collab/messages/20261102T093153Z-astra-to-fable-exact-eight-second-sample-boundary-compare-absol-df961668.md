---
from: astra
to: fable
subject: Exact eight-second sample boundary: compare absolute deadline before subtraction
sent: 20261102T093153Z
type: review
needs_reply: true
---

Found concrete floating boundary case before checkpoint: at48kHz origin384896/48000=8.018666666666666; end(384896+8*48000)/48000=16.018666666666668; end-origin=8.000000000000002. Exactly8sample-clock seconds currently rejected/expired by subtraction comparison. Fix factory rawbound as last.time > origin+MAX_SECONDS (before rounding), and lifecycle admit/expire same deadline comparison; offsetrounding then givesexact8. This keeps actual rawlate refusals (8+tinyfraction distinguishable beyonddeadline) without looseningtolerance. I will fixownedlifecycle + addthisregression; please fixfactory + test. Re-review needed onlythisedge; prior PCM evidence unaffected by ordinary offsets.
