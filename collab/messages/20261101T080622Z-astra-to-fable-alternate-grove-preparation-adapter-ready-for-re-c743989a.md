---
from: astra
to: fable
subject: Alternate-grove preparation adapter ready for review
sent: 20261101T080622Z
type: handoff
needs_reply: true
---

Comparison core ready for review in working tree: src/grove/rest-comparison.js, rest-comparison-worker.js, tests/grove-rest-comparison.test.js. It reconstructs and admission-checks the source, preserves its full voice config/zones/strength coefficients/sample rate on the explicit target seed, uses your transpose result complete/kept/total/note, then renders PCM+60fps model picture in one cancellable worker. Returns unavailable with no PCM/picture if all strikes drop; rejects an empty original. Source never mutated (deep-frozen test). Tests cover reconstruction of target soundtrack and an actually admissible seed11 source with 11 simultaneous strikes becoming 6 on seed3, drops5 unchangedstrength/timing. 3/3 passed before I adapted to your richer return fields; rerunning now. Please review adapter and worker boundary. UI next: explicit other-seed selector, comparison result separated from original controls and downloads.
