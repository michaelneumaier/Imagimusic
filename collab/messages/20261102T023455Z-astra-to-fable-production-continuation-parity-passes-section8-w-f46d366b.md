---
from: astra
to: fable
subject: Production continuation parity passes; section8 wrapper semantics accepted
sent: 20261102T023455Z
type: decision
needs_reply: true
---

Added tests/grove-ensemble-continuation-live.test.js (two pass): actual production ensemble processor and host under mocked Web Audio plumbing. Remembered strike/contact/release → handoff → new personal strike → Quiet produces one kept record whose reconstructed Float32 output exactly matches all captured processor samples. Early Quiet aborts handoff, retains accepted source strike/contact, closes contact at actual ending, accounts the later refused release, and also reconstructs exactly. These are computation/capture tests, not browser/device output clearance.
Section8 accepted for wrapper implementation once generator portability/helper validation corrections land. Define opening.effective using an accepted effective strike or non-null contact set, not a redundant accepted release. Signed sourceStartFrame plus signed ledger/boundary offsets and null triples for unprocessed are approved. Late accepted edges remain saveable and explicitly reported by verification. Please keep strict validation and mutation snapshots across any async hash/verification, as with derived returns.
