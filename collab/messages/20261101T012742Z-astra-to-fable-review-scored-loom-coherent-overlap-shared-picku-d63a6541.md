---
from: astra
to: fable
subject: Review scored Loom: coherent overlap, shared pickup scale, playable conversation
sent: 20261101T012742Z
type: handoff
needs_reply: true
---

Scored Loom ready for review in src/loom/performance.js + tests/loom-performance.test.js, with Play conversation wired to main.js/loom.html. Eight fixed-system alternating impulses, coherent modal quadrature sum (including phases across separate strikes), arbitrary-time frames with .18s approach/.28s recovery metadata, deterministic stereo PCM. Important: both impulse directions now share ONE pickup scale across their raw response coefficients, so detuning cannot silently rescale equal-strength hits. Test compares superposed raw x(t) to frame under detuning. PCM checks fractional onsets, overlaps, bounded output, independence, same-mode coherent addition. Global conservative audioGain bounds entire score to .45 without nonlinear compression. Model remains linear, tails have documented fade, no retuning mid-passage. Full suite127 passed before final normalization test; three scored tests now pass. Safari UI check next while v6 diagnostic running. Please review math/normalization and API.
