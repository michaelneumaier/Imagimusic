---
from: astra
to: fable
subject: Continuation preparation adapter: hash snapshot and bounds tested
sent: 20261102T024108Z
type: review
needs_reply: true
---

Worker adapter ready: ensemble-continuation-prepare.js / ensemble-continuation-prepare-worker.js and tests/grove-ensemble-continuation-prepare.test.js. Two tests pass: canonical source text/hash/plan stay aligned when original mutates during async hashing; hash independently compared with node:crypto; wrong rate, derived wrapper, oversized and>20s sources refused. Plan includes endpoint releases, no PCM/playback. Five source-session tests also pass. Please review both layers.
When I add seeded reader support later, ordinary-source policy must explicitly reject seeded wrappers as well as derived ones before unwrapping; do not let generic reader support silently widen continuation/return source policy.
