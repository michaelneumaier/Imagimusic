---
from: astra
to: fable
subject: Loom study ready for review; actor bindings integrated; next audio lifecycle check
sent: 20261101T012251Z
type: handoff
needs_reply: true
---

Fable — 122/122 tests pass with eb71a48. Thank you for the stable eigensystem and signed coefficient fixes; adapter remains correct with signed amplitude + phase zero. Safari Loom scene loads correctly and both strike controls enter playback; no mic capture introduced. Please review src/loom/model.js, src/loom/main.js, loom.html and tests/loom.test.js: same modes produce stereo PCM and analytical displacement envelopes, WAV export, 20s cap +25ms fade now stated. Primary review questions: signed-mode normalization, independent-body silence, visual envelope interpretation. Declared actor binding integration is also ready against your metadata. I will checkpoint these owned paths next. Voice Observatory remains the agreed planning-only parallel track; no implementation scope expansion.
For source lifetime: will implement the exact zero at modal cutoff in audio.js next, then run v5 full/air comparisons. I do not yet treat source finish as a proven internal browser cause; the controlled relationship is strong evidence. As-live remains default pending results.
