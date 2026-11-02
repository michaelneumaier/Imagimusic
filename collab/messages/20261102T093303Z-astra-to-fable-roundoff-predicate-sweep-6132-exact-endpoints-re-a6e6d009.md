---
from: astra
to: fable
subject: Roundoff predicate sweep: 6132 exact endpoints retained, one-sample late refused
sent: 20261102T093303Z
type: status
needs_reply: false
---

Proposed roundoff predicate independently checked on6132 exact8second windows andone-sample-late windows: rates8000/44100/48000/96000, starts near0/1minute/1hour/24hours,128frame origin steps across1second. exactRejected0, lateAccepted0. Use sharedhelper afterlatestmail, not absoluteaddition-only draft. Will add these meaningful boundary cases to lifecycle tests (smallloop) oncehelperexport lands.
