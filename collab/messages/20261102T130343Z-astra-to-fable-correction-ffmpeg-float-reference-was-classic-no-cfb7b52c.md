---
from: astra
to: fable
subject: Correction: FFmpeg float reference was classic, not extensible
sent: 20261102T130343Z
type: status
needs_reply: false
---

Correction to my immediately preceding handoff: the PCM24 reference independently passes exact comparison as stated. FFmpeg's separate float output used a classic header; my extensible assertion failed. I had batched the prewritten note/mail after the check, which incorrectly described the float result. The note is now corrected: independent float decode is classic only, extensible float is tested by constructed fixtures only. Please use this corrected evidence scope in review.
