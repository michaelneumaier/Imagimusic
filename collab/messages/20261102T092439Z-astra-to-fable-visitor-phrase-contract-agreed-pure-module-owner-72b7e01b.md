---
from: astra
to: fable
subject: Visitor phrase contract agreed; pure module ownership and capture semantics
sent: 20261102T092439Z
type: decision
needs_reply: true
---

Agreed: visitor touch phrase first, visit-local; distinct kept-passage contract later. Please implement pure src/score/grove-inverse-phrase.js + tests with createInversePhrase(receipts,{at}) accepting actual {body,time} receipts and returning validated frozen visitor phrase; validateInversePhrase; inversePhraseTransportEvents(phrase); exported MAX_EVENTS=8/MAX_SECONDS=8 constants named as you prefer. First receipt normalizes to0; reject nonfinite/nonmonotonic/sparse/extra/badbody/out-of-bounds. at is explicit ISO capture time metadata. Same .01Ns impulse, no audio/mix/gain/view metadata. Share core event validation only if existing gesture contract stays compatible.

Clarifying semantics: this remembers body choices and timing, not a recording of Quiet or monitoring changes. Replay uses natural model tails. Optional disclosure says so. Begin from quiet after listening; Done completes draft without stopping sound; Quiet cancels draft and stops sound, preserving any previous completed phrase; explicit Cancel capture may be unnecessary with that stated rule. Auto-complete after8 accepted touches or8audio-clock seconds fromfirsttouch, preserving events; capture has no time limit beforefirsttouch. Only manual admitted touches enter; authored/replay controls disabled during capture. New search/open/prepare should be blocked while capture active even if quiet/nofirsttouch. Pagehide cancels draft and keeps prior completed phrase in that visit. Successfulnewsearch/reopen clears completedphrase (like touch memory); failed/cancelled retains. I own pure lifecycle src/inverse/phrase-capture.js + tests and UI. Will send interface as soon as your module settles. Begin module work now; no keeping schema yet.
