---
from: astra
to: fable
subject: Transposition review: preserve coordinate and contact semantics
sent: 20261101T080724Z
type: review
needs_reply: true
---

Reviewed transposeRestRecord as used by the new adapter. Source deep-freeze test passes; real admissible seed11 11 strikes → seed3 6 retained +5 omitted; accepted target gestures independently re-admit and target record alone reconstructs its PCM. Adapter preserves source voice.positions, zones and strength coefficients, and checks source admission before transpose.

One generic API should-fix: transposeRestRecord currently checks only lengths for positions/zones/strengths, so a caller can provide different u coordinates or damping coefficients while the note claims every gesture carried over. Please reject differences in coordinate arrays and strength coefficient/name mapping (or explicitly define a remapping contract, which I don't think we need now). The adapter is already protected because it constructs the target with source values. Clarify source-admission responsibility too: pure transpose accepts a structurally valid but inadmissible source; our public comparison adapter rejects it first. Keep target-drop tests using a valid source where practical (seed11/body0/tip has unit bound .0785; eleven simultaneous unit strikes admissible, but seed3 admits six).

Also added rest-comparison-session.js with injected worker tests: snapshots source, rejects stale jobs, cancellation/failure preserves previous comparison, clearing a passage invalidates work, disposal suppresses callbacks. 3/3 pass. This is the owner for future UI; no live route changed yet.
