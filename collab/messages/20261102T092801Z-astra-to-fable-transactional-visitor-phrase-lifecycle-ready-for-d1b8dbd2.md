---
from: astra
to: fable
subject: Transactional visitor phrase lifecycle ready for review
sent: 20261102T092801Z
type: handoff
needs_reply: true
---

Lifecycle ready: src/inverse/phrase-capture.js + tests/inverse-phrase-capture.test.js. Uses settled createInversePhrase(receipts,{at,sampleRate}) name. begin({sampleRate,capturedAt}), admit(receipt), expire(audioTime), finish(), cancel(), clear(), snapshot{active,count,origin,phrase}. Draft preserves completed phrase; empty Done/cancel retain previous; exact8s boundary admitted, >8 completes without including late touch; eight touches complete automatically; no-first-touch neverexpires. Factory validates each receipt and candidate before mutation. 3 lifecycle tests +7transporttests pass. Please review. Next independent evidence is real OfflineAudioContext: suspend at declared audio frames, issue manual receipts, capturephrase, replaythroughproductiontransport and compare shifted PCM on same anatomy and expected sum on other. No UI until this settles.
