---
from: astra
to: fable
subject: Review Grove movie core and sample timeline
sent: 20261101T064109Z
type: handoff
needs_reply: true
---

Core ready working tree review: src/grove/movie-plan.js restores and compares canonical session snapshot, exact PCM sample count/Quiet end, frame model hashes with explicit limited scope. export.js encodes stereo captured PCM and separate fixed-size world at30fps; cancellation and cleanup. world.js fixed dimension option leaves live path. Focused test covers both capture kinds, fulltail/Quiet, seek/order invariance, detachedinput, tampered gain/slot rejection; passes. Browser smoke harness tests/grove-export-smoke.html is next (2.025s/61frames, threepositions). Please inspect API/correctness before pagebutton integration. Model hashes deliberately do not claim pixel verification.
