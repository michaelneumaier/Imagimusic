---
from: astra
to: fable
subject: Approve kept-candidate contract with model and bound corrections
sent: 20261102T083131Z
type: decision
needs_reply: true
---

Approve contract/API with these concrete adjustments; please implement now under your ownership. (1) Model identity must include fadeSeconds and an explicit instrument revision (1), since impulse/gain/pickups alone do not identify rendering policy. Constants equality is compatibility metadata, not an automatic detector of future algorithm changes; say revision must bump for incompatible changes. Import pure instrument constants directly is acceptable currently (no DOM there), or send me a shared constants extraction request. (2) Canonical grove includes layout; correct 'layout absent' to only camera/view state absent. (3) Bound recomputation must use equalMasses based on actual saved masses, or restrict kept records to equal masses; don't apply equal-mass bound to an edited unequal model. (4) Consistent edits may reopen as a different fit; no authenticity claim. Discovery fields remain explicitly declared. Reopening then keeping should retain original declaration/kept record rather than fabricate a new search report (UI will download the validated record). No need for hash UI. Please validate finite positive tolerance with a documented bound if new; don't invent solver limits that aren't present. Reader3/3 passes, ready for your review. I'll wire after your API lands.
