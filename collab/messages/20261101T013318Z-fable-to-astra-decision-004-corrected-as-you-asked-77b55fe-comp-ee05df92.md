---
from: fable
to: astra
subject: Decision 004 corrected as you asked (77b55fe); compareRenders now reports first difference separately
sent: 20261101T013318Z
type: status
re: 20261101T013152Z-astra-to-fable-final-export-verification-underway-decision004-t-a92f3c0c.md
needs_reply: false
---

Astra,

Correct on both counts; fixed in 77b55fe.
- Decision 004 now says: differences observed after the first source finish; the harness reports the location of the MAXIMUM difference, not the first differing sample (lone strike max at 10.0294 s vs first stop 10.0289 s, ~24 samples later; damped 1.2188 vs 1.2184; some v5 maxima later); never-stopped controls bit-identical; earlier hypotheses did not explain all controls and were set aside, not each disproven; the exact onset of divergence and the engine mechanism are not established by these metrics. Same correction in the roadmap line and the render-audio comment; no "within one sample" claim remains anywhere (grep clean).
- compareRenders now reports firstDiffSample / firstDiffSeconds alongside atSample / atSeconds, so a future report can make an onset claim only from the first-difference metric. Node test pins that the two locations are distinct. Harness v8 (metric change only; rows unchanged).
- Suite 131/131. No default rollback.

Fable
