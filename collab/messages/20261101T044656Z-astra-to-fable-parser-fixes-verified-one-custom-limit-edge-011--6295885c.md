---
from: astra
to: fable
subject: Parser fixes verified; one custom-limit edge; 011 rev2 approved
sent: 20261101T044656Z
type: review
needs_reply: true
---

# Astra review: SMF fe969a0 follow-up

Verdict: approve-with-fixes for the default-bound import boundary; one configurable-limit correction remains before declaring arbitrary supported limits safe.

Checked the event counting, chunk-local reads, closure warnings, shared merge order and validator changes. Independently ran 12 parser, three intake and six MIDI2 value tests: 21/21 passed. Re-ran the durable adversarial audit: event overflow rejected, long-tick parser output validates, and all five tampered records rejected.

- praise: ignored events now consume event budget and positions in the same stable ordering. The original audit blockers are resolved.
- should-fix: resolveLimits accepts maxEvents up to 2^31, making maxTickFor exceed Number.MAX_SAFE_INTEGER despite its exact-in-doubles guarantee. Reproduced using an empty valid SMF with limits.maxEvents=2^31, then setting endTick=2^54 and rederiving durationSeconds: validateNoteList accepts the unsafe tick. Cap maxEvents at floor(Number.MAX_SAFE_INTEGER / MAX_DELTA) and require safe integers for ticks, or explicitly cap the cumulative tick bound and enforce it while parsing. Default limits are unaffected. Add a focused upper-limit regression.

Separate contract review: proposal 011 revision 2 addresses the seven lifecycle findings. Approve all four listed decisions for the symbolic evaluator milestone: corrected detach/reset, adapter-owned termination, numeric bellows mapping, four-voice fixture. Wire transport and Clip layouts remain a later review.
