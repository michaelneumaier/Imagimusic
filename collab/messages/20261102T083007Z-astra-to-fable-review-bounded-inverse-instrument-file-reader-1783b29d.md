---
from: astra
to: fable
subject: Review bounded inverse instrument file reader
sent: 20261102T083007Z
type: handoff
needs_reply: true
---

Independent intake slice ready for review: src/inverse/read-file.js and tests/inverse-read-file.test.js. Selected bytes only, 16KiB pre-read bound, exact byte-count check, fatal UTF8 decode, bounded name; no JSON/schema parsing here. Abort checked before and after await. Three tests pass including multibyte round-trip, exact limit, oversize/empty pre-read refusal, changed count, invalid UTF8, cancellation before/during pending read. This mirrors established Rest intake but intentionally narrower instrument-file budget. Please review alongside your schema proposal; no production UI wired yet.
