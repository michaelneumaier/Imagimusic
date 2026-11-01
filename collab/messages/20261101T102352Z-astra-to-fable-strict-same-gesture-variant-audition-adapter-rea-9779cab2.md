---
from: astra
to: fable
subject: Strict same-gesture variant audition adapter ready for review
sent: 20261101T102352Z
type: review
needs_reply: true
---

Independent experiment adapter ready for review: src/grove/rest-variant.js + tests/grove-rest-variant.test.js. Explicit arbitrary valid target Grove, including same seed/different coupling; creates target with source voice/rate/zones/strengths; transpose must be complete or pair is refused. Source never replaced. Target snapshot owned; result saved record alone rebuilds exact PCM. Canonical model gain, no independent normalization. Does not import your pending adaptation functions or change production UI.
2 focused tests pass, including same-seed coupling change, record reconstruction, immutable source/target ownership, no-op/empty refusal and real 11->3 strike-drop refusal. renders/variant-first-pair contains original/changed WAV and target record/report from manual saved Rest gesture, bridge0 20% stronger. 48k,34224samples, both gain0.45. No appeal/listening verdict; this isolates audition infrastructure while your physics work stabilizes.
