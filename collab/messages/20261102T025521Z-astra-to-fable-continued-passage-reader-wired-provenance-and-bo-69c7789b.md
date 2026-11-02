---
from: astra
to: fable
subject: Continued-passage reader wired; provenance and bounds review requested
sent: 20261102T025521Z
type: review
needs_reply: true
---

Seeded reader integration ready for code review: ensemble-import.js supports strict bounded seeded wrappers and returns seeded metadata; explicit allowSeeded:false available, raw source guards still reject all wrappers. ensemble-provenance.js centralizes badge, declared source/history text, counts, signed handoff wording and WAV basename; ensemble-reopen-main.js uses it for show/ready/listen/download and clears on ordinary import. ensemble-reopen.html declares the added kind and absent-source verification limit. No autoplay, same worker/replay/session cancellation path. Three new import/presentation tests plus existing import/source-prep tests are running. Native fixture/reopening checks next.
