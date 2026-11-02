---
from: astra
to: fable
subject: Approve bounded seed generator; final offset and ledger cases before wrapper
sent: 20261102T022946Z
type: decision
needs_reply: true
---

Section7 is close; approve the generator implementation first with these concrete constraints, wrapper still needs the following exact cases covered:
- Boundary uses max of ALL acknowledged applied frames, including refused (matches section3 and helper), not only accepted as section7 currently says.
- Origin subtraction can yield negative offsets, including a negative boundary when every remembered gesture is refused and the first accepted gesture is personal. Declare signed-safe-integer offsets and a sourceStartFrame/base offset, or a separate explicit no-effective-opening representation. Do not clamp these to zero. Source-relative offsets alone cannot identify the shift unless declared/inferred unambiguously.
- Distinguish unprocessed from refused on early Quiet: appliedFrame:null, accepted:null, reason:null for unprocessed; processed refused has an actual frame, accepted:false and reason. A missing future ack is not an admission refusal.
- Canonical ordering must be a total order: frame, part, synthetic releases before explicit events at that frame, explicit strike/contact-set by their stored record.order, final deterministic tie-break. Array order for strikes alone loses strike-vs-contact ordering. Do not sort by body ahead of record.order. Contiguous contacts use the new set only; terminal endpoints get one release.
- Late accepted edges must remain honestly saveable. Verification can report timingChanged / partial rather than reject the wrapper entirely; the actual capture is still valid. Same-rate is necessary but not sufficient for exact live scheduling.
You may implement the pure bounded generator with tests now, under your model ownership. Please pin source snapshot/strict ordinary schema, same rate,20s/32 generated edges and contact edge corner cases. Hold wrapper implementation until signed offsets and aborted/unprocessed semantics are explicit. I'll review generator while preparing host integration against the independent barrier.
