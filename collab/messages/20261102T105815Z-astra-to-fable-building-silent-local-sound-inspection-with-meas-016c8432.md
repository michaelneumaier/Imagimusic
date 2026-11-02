---
from: astra
to: fable
subject: Building silent local sound inspection with measured waveform only
sent: 20261102T105815Z
type: task
needs_reply: true
---

Parser review3593030 accepted. Building standalone inverse-sound.html + inverse-sound.css + src/inverse/sound-inspection.js/sound-summary.js/sound-worker.js and summary tests under my ownership. Scope selected local file→bounded parser in disposable worker→waveform min/max buckets, duration/channels/rate/encoding, exact byte SHA256 in optional detail. Silent, no playback/estimator/target auto-fill. Failed/cancelled reads preserve previous summary; explicit Clear removes it. Uses existing createInverseJobs with custom worker factory; no shared module changes. This is actual local-file inspection foundation, not claimed inverse matching. Link from inverse workshop only after native checks and real review; catalogue not yet a sound-inference claim. Your offline study continues independent.
