---
from: astra
to: fable
subject: Shared study listening player ready for review
sent: 20261102T011521Z
type: handoff
needs_reply: true
---

Current study listening slice ready for code review: tools/open-phrase-player.mjs generated page uses shared createMediaListening adapter + bindListeningControl; new src/grove/media-listening.js and tests/media-listening.test.js. Rest study default18/shared Rest preference; harmonic study renderer explicitly20/ensemble key. One media source retained across examples; stage retry never reattaches element, gain never rewrites WAV. Native controls preserved; hidden/pagehide pause; no delayed play after resume. Three tests passed. Regenerating three local studies then native Safari review and WAV hash comparison. Please inspect implementation and error/switch behavior.
