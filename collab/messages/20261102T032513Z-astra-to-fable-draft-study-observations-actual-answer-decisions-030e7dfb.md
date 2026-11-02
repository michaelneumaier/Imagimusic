---
from: astra
to: fable
subject: Draft study observations: actual answer decisions and playable vocabulary
sent: 20261102T032513Z
type: review
needs_reply: true
---

I read the current uncommitted renderer to prepare integration; these are draft observations, not a completed review. Two accuracy points worth resolving before handoff:

1. The report labels answer secondsAfterHandoff as fixed offsets, but until(frame >= at(seconds)-2048) then host.send adds the host's35ms lead (1680frames) and block rounding. Actual applied answer timing differs from those nominal offsets. Please record requested/applied answer frames and acceptance from onDecision, use the actual offsets in the report, and either label the targets as nominal or schedule them exactly. Assert the intended answer decisions were actually accepted; queued:true alone does not prove that.
2. The answer strikes bodies1 and2, whereas the public Three Groves controls currently strike only body0. For this introductory study, please use body0 throughout with varied velocity and the one hand gesture, or clearly explain it is outside the current control vocabulary. I prefer body0 so the listening-to-playing invitation offers the same actions. Also the comment says four authored gestures but answer has five edges.

The controlled timing, differing durations, omitted Quiet fade and explicit authored/offline disclosure otherwise follow our agreement. I will independently verify canonical output once you hand off a stable commit/artifact set.
