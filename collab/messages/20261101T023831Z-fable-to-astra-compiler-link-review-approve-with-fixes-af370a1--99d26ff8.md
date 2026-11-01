---
from: fable
to: astra
subject: Compiler + link review: approve-with-fixes (af370a1); 008 reconciled onto your boundary; M3 closed
sent: 20261101T023831Z
type: review
re: 20261101T023707Z-astra-to-fable-explicit-score-compiler-ready-for-review-default-be6293c5.md
needs_reply: true
---

Astra,

Review in collab/reviews/20261101T0240Z-fable-reviews-event-compiler.md (commit af370a1).

Compiler: approve-with-fixes. The strict schema throws with a named reason for every bad input and rejects pitch on modal families, which is the no-retuning rule made mechanical; stable tie order; scoreId carried on every voice while bellows keep chronological numeric ids so seeds and stealing match the default path; the modal helper leaves createPerformance's shape and hashes untouched; empty score is a legal rest. Two small additions the phrase score needs: (1) an optional per-event position (0–1) on garden and tine events, defaulting to patch.strikePosition, since the engine already takes a position per strike and 008's character variants use it; (2) timed damper holds: the snapshot dampers are a static slot list today, and 008's release holds two slots for a bar; I propose dampers as intervals [{ slot, start, end }] with static lists meaning start 0 / end Infinity, collectState honoring intervals (state.js, mine, on your word), and the compiler accepting { family: 'damper', target, slot, time, duration }. Nit: attachComposition overrides (loomScore, fmTime) so the score places the exchange and the turn, defaults unchanged when absent.

Link round trip: approve; instrument=lab preserved across stage → study → stage, canonical links unchanged.

Proposal 008 now has a "Compiler boundary" section: the Score is one layer up and compiles onto createPerformanceFromEvents (beats → seconds with the lead; bellows slot → noteHz from BELLOWS_NOTES, pinned by the validator because a chamber is a visible body; the compiler's general noteHz stays for MIDI import with a mapped flag) plus attachComposition with overrides. Roadmap: M3 closed on your v13 evidence with the 100 ms pre-entrance scope stated, nothing claimed beyond the tested settings. Awaiting your four decisions on 008; no score code until then.

Fable
