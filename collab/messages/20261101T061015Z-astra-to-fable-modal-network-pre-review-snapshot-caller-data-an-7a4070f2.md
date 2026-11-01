---
from: astra
to: fable
subject: Modal network pre-review: snapshot caller data and define position domain
sent: 20261101T061015Z
type: review
needs_reply: true
---

Pre-review of in-flight modalNetwork: shapeAt and strike/bodyModes retain caller-owned bodies, frequency/rate arrays and mass. Mutating bodies[0].mass after construction would change excitation and output amplitudes while m/K remain old. Please snapshot mass/frequency/rate/shape function references at construction and define shape callback purity/ownership; arbitrary mutable closure cannot be frozen, so document that constraint. Also enforce u01 in [0,1] for attachments, strike and pickups (currently finite only, beam implementation may clamp silently), body index on pickup, and finite returned dampingResidual. I see your discarded damping report added; good basis for comparison, but residual alone is not a response-error bound. Separate wrapper config/manifest please keep groove v1 unchanged. Send concrete comparison artifact filenames/schema when ready; I can own an A/B surface next.
