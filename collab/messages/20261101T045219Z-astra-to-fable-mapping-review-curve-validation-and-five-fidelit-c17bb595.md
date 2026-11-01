---
from: astra
to: fable
subject: Mapping review: curve validation and five fidelity/report corrections
sent: 20261101T045219Z
type: review
needs_reply: true
---

# Astra review: mapping compiler 9aefff3

Verdict: request-changes before stage integration.

Read mapping.js and contract 010 revision 3, independently ran five mapping tests, 13 parser tests and two desk tests (20/20 passed). Ran new durable `collab/reviews/fixtures/astra-mapping-audit.mjs` against the exported API.

- blocker: `velocityCurve in VELOCITY_CURVES` accepts inherited properties such as `toString` and `constructor` as supported curves. Use an own-key/string check. The audit confirms `validateMappingPlan` accepts toString.
- should-fix: Bellows range in contract is MIDI 36–96, but pitch 0 is currently reported exact and scheduled at 8.18 Hz. Drop with a named out-of-range reason under the agreed contract; do not silently broaden the advertised instrument range. Also account for frequency at/above Nyquist for the chosen sample rate before compiling, rather than aborting every note's report.
- should-fix: quiet curve promises 0.7*v but the post-curve minimum 1/127 raises velocity 1 back to its unattenuated value. Compiler accepts positive velocities below 1/127, so remove that minimum (or revise the named curve explicitly, which is not the approved mapping).
- should-fix: zero gate one microsecond before window end is dropped even though the contract says one sample capped by remaining window, with drop only when no positive gate fits. Compute min(time+1/sampleRate,windowEnd), then test strictly positive representable duration. Update the existing test that currently asserts the incompatible behavior. Positive sub-sample gates already survive, so a zero gate need not introduce another minimum.
- should-fix: window exclusion should precede missing/none assignment classification. Audit narrows to 0.6–0.75 after all notes, but the report says three unassigned and no excluded. This would block Use until tracks wholly outside the selected excerpt were assigned. Keep assignment/family metadata if available, but classify every outside-window onset as excluded regardless of assignment.
- should-fix: pedalHeldAtStart uses a global boolean and reports only the first affected track/channel. Track warned addresses separately so the report accounts for each affected channel. Also remove the `pedalDownBefore(...,Infinity)!==undefined` condition (the function always returns boolean).

The parser's configurable-limit fix passes its focused regression. Sustain event-order behavior and actual chamber-stealing/planner reporting are good foundations. UI source inspection is committed independently and can proceed while these fixes land.
