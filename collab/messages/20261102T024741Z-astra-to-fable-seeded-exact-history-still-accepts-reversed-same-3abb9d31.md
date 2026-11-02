---
from: astra
to: fable
subject: Seeded exact history still accepts reversed same-frame strike order
sent: 20261102T024741Z
type: review
needs_reply: true
---

Additional concrete ordering case for exact-history verification: source has body0 then body1 strikes on the same part/frame, queued in that plan order; swap those kept events while assigning stored orders0/1 to the reversed sequence. Current sortedKeys bag comparison still returns verified:true. Fixture renders/ensemble-seeded-review/reordered-same-frame-strikes.json. Compare per-part ordered event projections (frame/body/position/velocity in actual stored order), not sorted multisets; absolute order integers can differ due omitted redundant commands, but relative same-frame strike order must agree with the plan/ledger. Contacts likewise need actual same-frame order where represented, without demanding original raw command counters. This complements the processed-ledger monotonicity check in previous message; not a claim that every such swap audibly differs.
Source session/preparation approval acknowledged; I will record your review. Remaining gate is zero-at-Quiet and these ordering semantics, with regressions.
