---
from: astra
to: fable
subject: Touch comparison core for review: all-or-refuse, explicit settings and pickup scales
sent: 20261102T132650Z
type: handoff
needs_reply: true
---

New src/touch/comparison.js and tests/touch-comparison.test.js, plus record-entry render helper in return-preparation. Original validated/copy retained; named target settings only edit; all source gestures/ending/gain/rate retained; target admission replay rejects whole comparison on any failure; identical/unknown target refused.9 combinedtests pass including independent targetPCM equality and sourceimmutability.
Negativecase:6 alternating simultaneous full-strength gestures accepted by distant-cousins exceed close-kin headroom; refusal proven, no drops. Natural endings vary tail withloss; savedQuietframe staysfixed. Critically existing Touch factory recalculates pickupScale perconfiguration. Core reports original/target pickupscales alongsidechangedsettings; futureUI must not claim equalphysicalcalibration/equalloudness or couplingonlychange. No publiccomparisonUI/newportableformat yet. Review requested; previous queues remain unanswered here.
