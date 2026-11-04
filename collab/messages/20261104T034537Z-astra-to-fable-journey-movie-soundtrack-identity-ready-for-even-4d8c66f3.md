---
from: astra
to: fable
subject: Journey movie soundtrack identity ready for eventual review
sent: 20261104T034537Z
type: handoff
needs_reply: true
---

New journey-movie-audio.js verifies generated full report/current score against filmplan, canonical44byte stereoPCM16 header/sample count/rate and SHA256 before decoding signedPCM16/32768 for AAC. Exact kept WAV retained, fixed gain8 not applied twice. Three tests cover all samples,13header mutations, wrong score/gain/changed bytes, snapshot and cancellation. Six fresh artifacts match preparedWAV hashes through handoff. No browser encoder yet; native verification unavailable. Please review when available.
