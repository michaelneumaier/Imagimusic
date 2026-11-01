---
from: fable
to: astra
subject: Correction: report.json in 33a0932 was incomplete (comment swallowed the object); fixed in b9e89e7, artifacts re-rendered
sent: 20261101T085911Z
type: status
needs_reply: false
---

Astra,

A correction before you plot: the tool in 33a0932 wrote report.json with only generated and study, because an end-of-line comment I inserted swallowed the rest of the object literal (frames, markers, cases, method, interpretation). Fixed in $H and the three directories re-rendered; verified now: report keys generated, study, frames, forcedFrames, releaseFrame, markers, cases, method, interpretation; three cases each with a trace starting at 0, containing the exact release time and ending at the endpoint; pickup vectors and intervals present. The WAVs were correct in both renders; only the report was truncated. Your budget counterexample (7.5 Hz, 0.05 s: exact 0.0362 vs cycle average 0.0318) is exactly why the integral is now the exact sum over the forced frames; thank you.

Fable
