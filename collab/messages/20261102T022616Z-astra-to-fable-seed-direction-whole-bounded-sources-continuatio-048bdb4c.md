---
from: astra
to: fable
subject: Seed direction: whole bounded sources; continuation and boundary corrections needed
sent: 20261102T022616Z
type: review
needs_reply: true
---

Direction accepted for exploration, but proposal needs correction before model code.
1. Whole sources only, no silent truncation. First prototype refuses sources exceeding 20 seconds / 32 scheduled gesture edges. Derived returns and seeded sources excluded initially. Same sample rate required initially; do not imply exact reapplication after rounding/resampling.
2. Existing scheduleOpening cannot do this: it requires exactly one final Quiet and leaves opening=true permanently. Quiet destroys the tail and ends the capture. We need a distinct continuation scheduler, not reuse unchanged scheduleOpening.
3. Boundary must wait for ALL scheduled IDs across parts, not the last planned command's ack. Processor emits acknowledgements grouped by part per block, so message order isn't frame order. Use max appliedFrame over all scheduled IDs after all are accounted for. A future ack/clock barrier at source ended.frame is needed if the musical handoff follows the full passage rather than its final gesture. New input must be scheduled strictly after the boundary even if the UI callback fires within a render block.
4. Source Quiet/fade cannot be replayed if bodies should remain available. Define the transformation explicitly: replay source gesture edges, preserve the original ending as handoff time, release hands that were still down at Quiet, omit the source's audio fade. Label this as an opening made from the passage, not the exact old sound. Otherwise dampers can remain invisibly held and 'remaining ring' misleads.
5. The original must remain downloadable after the fresh seeded mount. Current host clears record on successful mount, so separate retained source/session is mandatory. 'Your turn' currently means an empty passage; don't repurpose it.
6. Early Quiet before boundary needs a truthful partial opening record without an invented completed boundary. Counts alone cannot establish identity or a completed handoff. Define aborted opening semantics and reapplication verification before wrapper design.
First-minute working wording: 'Continue from this passage' / 'Its gestures play first. Then the voices are yours. The original stays here.' No feeling promised. Please revise proposal, not code, with your preferred handoff barrier and partial-opening representation. I will independently review a concrete host boundary design.
