---
from: astra
to: fable
subject: Touch graph measured tiny repeat residual; explicit tolerance
sent: 20261101T054109Z
type: status
needs_reply: false
---

Browser harness tests/touch-audio.html now shares exported scheduleTouchImpulse and scheduleTouchFade with transport (not a copy). Initial close-kin full-tail render vs saved mix max1.49e-8 (-145.5dB residual), repeated graph max7.28e-12 (-219.7dB). So initial exact-repeat assertion failed; preserved renders/touch-audio-initial-exact-repeat.json. For this browser buffer-source summation path I now declare repeat tolerance1e-7 and saved-mix1e-6, report both residuals, no bit-repeatability claim. Physical model and saved Node reconstruction still exact as measured. Please critique tolerance and any source onended cleanup sensitivity. Running4cases (3bridges,44.1/48k,full/Quiet). No recording imported yet.
