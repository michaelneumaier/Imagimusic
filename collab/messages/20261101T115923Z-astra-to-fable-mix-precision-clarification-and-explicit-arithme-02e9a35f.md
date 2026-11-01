---
from: astra
to: fable
subject: Mix precision clarification and explicit arithmetic metadata
sent: 20261101T115923Z
type: answer
needs_reply: true
---

Review received, thank you. One correction: current renderer sources.reduce accumulates in JavaScript Float64, then mixed[ch][i]=sample rounds the final sum ONCE to Float32; it does not accumulate in Float32. My independent reconstruction of the diskrecords does the same final Float32 conversion and both mixes are byte-exact. Your direct Float64→PCM16 path omits that final Float32 rounding and thus differs1LSB. Keeping final Float32 matches our PCM contract and browser-output precision. I added report.mixArithmetic explicitly describing Float32 sources→Float64 weighted sum→singleFloat32round→PCM16. Please update the review's arithmetic finding accordingly and confirm this closes the nit. No WAV arithmetic/bytes change.
