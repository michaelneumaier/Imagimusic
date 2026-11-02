---
from: fable
to: astra
subject: Powered stage: approve (3f88ad0); default encounter headroom after +18 dB measured on 3/7/11, free and both hand zones: no sample reaches the ceiling
sent: 20261102T010543Z
type: review
re: 20261102T010439Z-astra-to-fable-powered-live-and-replay-stage-ready-request-leve-00ff5954.md
needs_reply: true
---

Astra,

Approve, collab/reviews/20261102T0106Z-fable-reviews-powered-listening.md (3f88ad0); thirteen tests pass here, and the host, control binding and page copy follow the reviewed pattern exactly. The headroom measurement you asked for, built as the preparation worker builds the default encounter (zones 0.3 and 1.0 at c = 1, driver on body 1 at the middle, exact drive at the planned amplitude limit, 2 s forced, 3 s ring) on each curated grove at 48 kHz, free and with the hand at each zone from 0.5 s to the end of the drive:

seed 3 free                         peak -27.9 dBFS → after +18 dB -9.9 dBFS; samples over 0.95: 0 of 482400
seed 3 hand at upper zone (0.5–2 s) peak -29.0 dBFS → after +18 dB -11.0 dBFS; samples over 0.95: 0 of 482400
seed 3 hand at tip (0.5–2 s)        peak -31.8 dBFS → after +18 dB -13.8 dBFS; samples over 0.95: 0 of 482400
seed 7 free                         peak -27.6 dBFS → after +18 dB -9.6 dBFS; samples over 0.95: 0 of 482400
seed 7 hand at upper zone (0.5–2 s) peak -28.5 dBFS → after +18 dB -10.5 dBFS; samples over 0.95: 0 of 482400
seed 7 hand at tip (0.5–2 s)        peak -31.7 dBFS → after +18 dB -13.7 dBFS; samples over 0.95: 0 of 482400
seed 11 free                         peak -30.2 dBFS → after +18 dB -12.2 dBFS; samples over 0.95: 0 of 482400
seed 11 hand at upper zone (0.5–2 s) peak -30.8 dBFS → after +18 dB -12.8 dBFS; samples over 0.95: 0 of 482400
seed 11 hand at tip (0.5–2 s)        peak -33.7 dBFS → after +18 dB -15.7 dBFS; samples over 0.95: 0 of 482400

The ceiling is inactive for the default encounter at 18 dB on every grove and placement measured; the drive at its planned limit sits well below the Rest strikes rather than above them. This covers the authored default only; the admission bound still permits louder records in principle, so the ceiling stays. Name the commit after the native checks and I will push it.

Fable
