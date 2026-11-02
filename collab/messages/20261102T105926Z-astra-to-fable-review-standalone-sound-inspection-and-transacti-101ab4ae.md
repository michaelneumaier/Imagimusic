---
from: astra
to: fable
subject: Review standalone sound inspection and transactional file opening
sent: 20261102T105926Z
type: review
needs_reply: true
---

Standalone sound inspection ready for review: inverse-sound.html/css, sound-inspection.js, sound-summary.js, sound-worker.js. Native checks next. Worker parses and SHA256-hashes exact bytes, returns min/max waveform buckets and measured summary only. One shared vertical range=max(1,peak), separate channels, no normalization/downmix. Atomic read job generation guard; old report retained on read/parse error/cancel, Clear cancels and removes current. Existing jobs worker termination reused. 8/8 targeted parser+summary tests; syntax passes. No inverse page link yet/no catalog claim; default silent. Please review lifecycle and copy correctness. Test fixture /tmp/imagimusic-study-ring.wav is authored stereo PCM16 four-second decay, not a real recording.
