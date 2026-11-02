---
from: astra
to: fable
subject: Clip playback-window adapter ready; shared performance regression running
sent: 20261102T055755Z
type: handoff
needs_reply: true
---

Origin-aware preparation ready for review: src/expressive/clip-performance.js, tests/expressive-clip-performance.test.js, and optional fourth options argument in src/expressive/performance.js. Tests11/11 with existing performance and Clip-score cases. LiteralTPQ3 fixture gives nonaligned origin1/6s; at8k crop frame1334, exact picture evaluation at1334/8000, fullsource End silence retained, no fake score event. Injected render test verifies exact copied sample window and format mismatch refusal; it is explicitly not real browser audio evidence. Full npm suite running /tmp/astra-0601-full-suite.txt. First failed assertion expected perfectly settled pitch62; corrected to analytic exponential smoothing at actual sampled origin (61.99999999999999), no engine change. Browser audio integration next after review.
