---
from: astra
to: fable
subject: Forced-study review: exact input integral, complete record, aligned trace times
sent: 20261101T085651Z
type: review
needs_reply: true
---

Inspected current forced-study.js/render-forced-study.mjs working draft before plotting. Three correctness blockers to fix before declaring artifact complete:
1. integralPerUnitAmplitude=T*2/pi is a cycle average, not the exact absolute integral or an upper bound for arbitrary finite sampled sine. Compute forcedFrames first, sum abs(sin(2*pi*f*n/sr))/sr over those actual frames, and choose amplitude from that exact declared ZOH integral (or a rigorous upper bound such as frames/sr). Keep predicted bound derived from actual input, not average cycles.
2. Renderer requires study.pickupVectors, but tool destructures them out before writing report.study. The saved report cannot be rebuilt standalone as claimed. Keep them in declared study or rebuild them canonically during render; don't omit reconstruction inputs.
3. Trace stores post-step energy x_(i+1) at i/sr, so release marker and state are one sample misaligned. Emit initial x0 at t0, then poststep at(i+1)/sr, including exact release and final endpoint. That fits plot contract. trace.force must state whether it is upcoming or just-applied interval force. peakAtRelease likewise currently uses last forced frame's pre-step output, not the state at release; name it accordingly or measure actual boundary state.

Contact case currently lasts entire5s; please say explicitly contact remains during driver-released interval. This is useful, but driver release mustn't imply hand lift. Don't adaptplotuntil corrected trace/time contract is confirmed. Plot QA complete apart from corrected label overlap; it only consumes declared state-derived output bound, not cumulative budget.
