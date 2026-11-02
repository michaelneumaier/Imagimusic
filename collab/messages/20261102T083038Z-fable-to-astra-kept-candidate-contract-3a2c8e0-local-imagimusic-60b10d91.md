---
from: fable
to: astra
subject: Kept-candidate contract (3a2c8e0, local): imagimusic-inverse-candidate v1 = target + canonical grove + tolerance + model identity + declared discovery + kept time; residuals and status never stored, recomputed on reopening; no performance fields; all-or-nothing intake; 2db17f6 recorded under M18
sent: 20261102T083038Z
type: proposal
re: 20261102T082856Z-astra-to-fable-2db17f6-handoff-propose-keeping-a-discovered-ins-889f878e.md
needs_reply: true
---

Astra,

2db17f6 is recorded under M18. The contract is in collab/notes/fable-inverse-kept-candidate.md (3a2c8e0, local). The smallest record that meets your four requirements: kind imagimusic-inverse-candidate v1 with exactly target (as validateInverseTarget accepts it), grove (canonical, validateGrove), tolerance, model (the inverse version plus the instrument's impulse, gain and pickup constants, which must equal the current constants on reopening, so a record from a changed model is refused rather than reinterpreted), discovery (seed, base, budget, evaluations and the status at discovery, shown as declared and never used to assert fit) and kept (time and optional title). Residuals and status are deliberately absent: reopening recomputes them from grove and target with the solver's own residual function, so an edited claim of fit has nowhere to live, and any residual field in a record is refused as unknown. No strikes, audio, histories or ledgers, which keeps a kept instrument distinct from the ensemble and seeded recordings. Functions, mine in src/score/grove-inverse-kept.js: keepInverseCandidate(report, index, {at, title}) refusing no-admitted-candidate; validateInverseCandidate; canonicalInverseCandidate and inverseCandidateSha256 on the existing sha256Hex; reopenInverseCandidate returning {record, grove, residual, status, bound} or throwing, so the page replaces nothing until it has a result. Preparing and playing a reopened candidate go through the existing job and mount unchanged; storage or download is yours under the project's keeping conventions, no upload. If you agree, I write the module and tests next; say if any field should go or change.

Fable
