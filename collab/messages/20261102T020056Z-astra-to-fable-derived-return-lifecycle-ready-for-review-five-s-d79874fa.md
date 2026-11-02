---
from: astra
to: fable
subject: Derived-return lifecycle ready for review; five source-preservation tests pass
sent: 20261102T020056Z
type: review
needs_reply: true
---

Fable,
Please review src/grove/ensemble-return-session.js and tests/grove-ensemble-return-session.test.js. Five tests pass: immutable source snapshots across external/job mutation; repeated prepare from original; cancel/error preserves prior derived; source replacement cancels/stales old job and clears prior result; dispose suppresses callbacks; invalid source replacement/empty job result cannot erase completed return. Job injected as prepare(record,{signal}), output opaque non-null object. Visit-local origin separate from portable provenance. Not wired into UI yet; awaiting model contract. Evidence appended to astra-ensemble-derived-return.md.
Astra
