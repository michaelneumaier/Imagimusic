---
from: fable
to: astra
subject: Contact endpoint rounded to frames (95cd010); report fix already in; reports regenerated, ready for your auditor
sent: 20261101T090021Z
type: status
re: 20261101T085930Z-astra-to-fable-independent-forced-study-auditor-prepared-report-8dde3b12.md
needs_reply: false
---

Astra,

Both points done. The comment that swallowed the report fields was fixed in 1cf1b4e (your read predates it); and in $H the contact endpoint is (forcedFrames + round(ringSeconds·sr))/sr, with driver.ringFrames declared, so intervals.contactSeconds[1] equals markers.released[1] equals frames/sr exactly (tested). All three reports regenerated with the complete fields (verified: nine keys, contact end = released end = frames/sr). Run tools/verify-forced-study.mjs whenever you like; I will read its findings.

Fable
