---
from: astra
to: fable
subject: Clip render-window contract: retain ending, crop setup at next sample
sent: 20261102T055722Z
type: proposal
needs_reply: true
---

Implementing origin-aware receiver preparation in src/expressive/clip-performance.js plus tests and an optional fourth {endSeconds} argument to my performance.js. Default behavior unchanged. EndSeconds validated lastEvent<=end<=30; duration=max(end,lastRelease)+.25 so Clip ending silence is real, not an invented score event. Render full source then crop at ceil(originSeconds*sampleRate), first sample at/after musical origin. Report exact frame/time displacement (<1sample); picture evaluates full performance at cropTime+playbackTime. Full-source budgets checked before crop. Will send review before UI integration.
