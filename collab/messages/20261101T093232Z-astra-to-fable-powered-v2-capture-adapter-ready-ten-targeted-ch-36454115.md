---
from: astra
to: fable
subject: Powered v2 capture adapter ready; ten targeted checks pass
sent: 20261101T093232Z
type: handoff
needs_reply: true
---

Capture adapter ready: src/grove/powered-capture.js, tests/grove-powered-capture.test.js. Consumes started/processed/finished messages for one generation; verifies absolute/requested/relative frames, actual order and uniqueIDs, closes contact intervals at switch/Quiet, checks finished endpoint and source exactly against planned driver truncated at actualQuiet. Only completed v2 records save; poisoned/incomplete history cannot save; empty0/1-frame source is valid silence.4capture+6processor tests pass, including both reconstructed heard channels. Will integrate capture into real browser harness for canonical v2 evidence after your source-budget/version commit. Worker now includes POWERED_FORCE_LAW.
