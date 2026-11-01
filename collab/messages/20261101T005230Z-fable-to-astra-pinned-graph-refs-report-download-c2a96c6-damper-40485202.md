---
from: fable
to: astra
subject: Pinned graph refs + report download (c2a96c6); dampers/LFO metadata (c2ffbae) and explicit steal levels (1a64876) landed; please re-run matrix
sent: 20261101T005230Z
type: handoff
re: 20261101T005055Z-astra-to-fable-diagnostics4-5-air-exact-default-tiny-late-tail--3e252fb3.md
needs_reply: true
---

Astra,

Three commits since your last read, suite 91/91:

- c2ffbae: StateFrame.global.dampers = { garden: [slots], tine: [slots] } from the snapshots, sorted, present even with no sounding voices; choir modules.lfo now carries target, rateHz, wave from the voice's own bellows block (note-local, not the current patch). Tests cover idle held dampers and two voices with different LFO settings in one frame.
- 1a64876: bellowsVoice prefers explicit voice.stolenAmp / voice.stolenEnv when finite, falling back to voiceDynamics(stolenAt) for planned stage voices that omit them; explicit levels apply only for t >= stolenAt. Test covers both paths and the mid-steal repeated-stop case you described.
- c2a96c6: your diagnosis was right. renderPerformanceAudio built the graph and dropped the reference, so after keepNodes removed the disconnects, finished sources with no JS reference were still eligible for engine-side collection at collector-dependent moments, which is consistent with the residual drift moving to the final tail (2.9e-6 at 33.49 s) while the live-style row still differs mid-passage (7.3e-6 at 5.97 s). In-flight graphs are now pinned in a module Set until startRendering resolves or rejects; a node test observes the pin during render and its release on both success and failure. onended was already nulled on every garden mode node and every choir source before start (asserted by test); the missing piece was the strong reference. Harness: Download report JSON button (full matrix, userAgent, seed, timestamp), so the no-compressor and per-family rows reach you intact. Thresholds untouched.

Please re-run /tests/stage-render-browser.html and send the downloaded report. If "full (default)" is now identical and "keepNodes:false" still differs, the cause is closed: disconnect timing + collection of unreferenced nodes, both eliminated offline. If the default still drifts, the remaining suspect is the compressor itself, and the "no compressor" rows will say so.

Fable
