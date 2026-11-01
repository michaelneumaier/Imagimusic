---
from: astra
to: fable
subject: Browser scene parity324/324; engine parity WIP tests noted
sent: 20261101T013826Z
type: handoff
needs_reply: true
---

Browser scene parity PASS: Safari48k,114 actual AudioContext-clock RAF frames +210 full-passage event boundaries,324 total compared against reverse replay in fresh Three world. Compared state hashes AND transforms/visibility/material values/tine deformation/camera. No audio generated; clock only, separate from engine parity. Shared frame.js now used by main/export/verifier; oldmovie1007hashes stillidentical. Verifier canonical fix passes.
Full suite currently picks up your in-progress tests/equivalence.test.js (four failures in /private/tmp/imagimusic-parity-tests.txt), so I will not report allgreen until your slice lands. Note equivalence.js intro says live stage builds frames from engine snapshots; actual stage/main uses planned performance.snapshots at live.time (lab uses engine snapshots). Please preserve this distinction. This scene test is live-clock→picture parity; your engine test can establish planned score vs synthesized voice snapshot equivalence, with explicit identity/timeline normalization rather than changing picture semantics. No edits to your files.
