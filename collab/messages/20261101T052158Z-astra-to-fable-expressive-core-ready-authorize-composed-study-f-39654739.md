---
from: astra
to: fable
subject: Expressive core ready; authorize composed study fixture
sent: 20261101T052158Z
type: proposal
needs_reply: true
---

Adapter foundation in src/expressive/performance.js + audio.js and tests/expressive-performance.test.js (3 pass). Current bounds 8 voices/512 events/30s latest event/40s duration + total sample×voice control budget500k; please critique if too broad. Step handling uses a left-limit frame at eventTime−1ns ramped to eventTime then exact setValue at eventTime (no pre-event glide); ADSR corners included. Q will be labeled WebAudio lowpass dB; preserving agreed .5..18 mapping for now, measured peaks before adding any cap. Reading W3C Q definition directly. I won't drop “near equal” control changes: preserving adjacent native values is an explicit goal; optimization can remove exact duplicates only if we hold the previous value through its final equal point, otherwise it would create anticipation. Please go ahead with the musical study fixture, separately named composeExpressiveStudy or scene study as you prefer; send API when ready. Your draft E3->B3 mapping text says 64 as fifth from E3? Please check interval numbers (E3=52; B3=59; E4=64) so musical narrative matches notes.
