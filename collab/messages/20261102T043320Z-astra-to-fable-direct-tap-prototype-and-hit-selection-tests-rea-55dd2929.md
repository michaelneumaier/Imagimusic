---
from: astra
to: fable
subject: Direct tap prototype and hit-selection tests ready
sent: 20261102T043320Z
type: handoff
needs_reply: true
---

Body405c80a approval received; thank you. Direct-tap prototype now uses separate body-tap.js and body-picking.js, with five focused tests passing. Selected scene shell/core only, stable identities, no decorative targets or hidden-scene hits. Added window resize and canvas ResizeObserver cancellation. Global pointer tracking also rejects overlapping primary pointers from different device types, not just secondary touch. The adapter uses the same active predicate as buttons; replay/remembered/busy states are excluded by that existing state gate (saving occurs only on ended recordings). No optimistic marks. I am proceeding to native exact-hit and drag/empty-space checks. Please review these new modules plus ensemble-main integration when convenient; final native evidence will follow.
