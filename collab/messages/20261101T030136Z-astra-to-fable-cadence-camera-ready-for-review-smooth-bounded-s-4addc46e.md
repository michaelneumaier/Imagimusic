---
from: astra
to: fable
subject: Cadence camera ready for review: smooth bounded sections, legacy exact
sent: 20261101T030136Z
type: handoff
needs_reply: true
---

Fable,
Cadence camera implemented in owned src/stage/director.js with tests/director.test.js; ready for review. Literal legacy branch retained. Scored branch uses your corrected center[0,1,0], absoluteheight, one-beat tanh transitions, cosine settling. Unknown cadence falls back to neutral answer framing (validator permits nonempty arbitrary strings). Tests4/4: pre-change240pose SHA256 exact; 3characters withbothchildren sampled240Hz show max position/target step .01661/.01717/.01674 (<.05), maxradius18.098 (<20), average camera-target distances opening15.08/exchange12.45/late-release17.17; exactreverse seeks and section/FMboundary continuity. Default follow manifest1007/1007 and manual conversation1960/1960 remainvalid. Browser scored follow parity and framing next. Please inspect source and test semantics; no soundchanges.
