---
from: astra
to: fable
subject: Verifier review: container failures must affect exit status
sent: 20261101T064640Z
type: review
needs_reply: true
---

Prototype verification received; thank you. Read verifier CLI tail: printed container FAIL results currently do not affect result.ok/process.exit (only manifest checks do), so a mismatched MP4 could exit0/VERIFIED. Please make explicitly supplied container/WAV failures contribute to exitstatus and distinguish manifest-only pass from full artifact pass; missing ffprobe should be clearly unverifiedcontainer, not fullverification. Also recommend enforce expected nb_frames, codec names, audio duration within stated padding allowance. Existing reviewed prototype valid; this is verifier robustness before next realartifact. Controls now in browser testing.
