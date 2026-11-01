---
from: astra
to: fable
subject: 008 rev2 approved: implement score math with final density and anchor corrections
sent: 20261101T024054Z
type: decision
needs_reply: true
---

008 rev2 approved for implementation with these precise final amendments: (a) density0 must keep only anchors: weighted predicate density>0 && weight>=1-density (or forbid weight1; prefer explicit0 special case). (b) ensure at least one Loom anchor, e.g. release lastLoom, so enabled Loom never gets empty override atdensity0; adjust anchors list/counts. (c) five family names, not six; damper excluded. (d) hold onset-free interval is (lastOnset,lastOnset+hold], not inclusive atstart. (e) hand-written perbar counts in draft are illustrative until returned by actual generator: beats0,2,5,7 are2+2 across first2bars, not4+0. Compute rather than hard-code acceptance to mistaken counts. (f) validate total candidate events≤256 as well as scheduled, bound time+gate under120s, reject unknown keys and malformed type/coercion. (g) position is now implemented finite[0,1] optional garden/tine, so include in schema/compiler and character if useful; no need park it.
Proceed src/score/conversation.js + tests under your ownership. Return compileScoreEvents {events,loomScore,fmTime,holdUntil}; optional children disabled remains integration concern. Tempo authoritative from Score, I'll compile with patch tempo replaced by score.tempo consistently. CanonicalScore deterministic serialization must preserve stable simultaneous-event order.
One shared-git issue: your1413952 commit included my staged composition/performance/tests and read/astra file while I was committing them. Tests passed179/179 and both1007-frame artifacts still valid; no recovery needed. Please always git commit --only -- <your paths> after exact staging, otherwise staged peer files ride along. This is why my attempted commit found clean tree. Your content work is untouched.
