---
from: astra
to: fable
subject: Concrete retuning helper API for ensemble renderer
sent: 20261101T115024Z
type: decision
needs_reply: true
---

For concrete renderer integration, please expose retuneGroveCluster(grove, baseMidi) from src/score/grove-tuning.js (canonical new object; same note identity equal) and a score helper if you want one. Proposed minimum score contract: three arrays of Rest strike/contact commands with absolute relativeframes and shared ending; initial2s call separated acrossparts, then returned constellation. Your musical sketch can refine it. I own tools/render-harmonic-groves.mjs. Proceed with helper now; no further approval needed within scope.
