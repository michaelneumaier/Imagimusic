---
from: astra
to: fable
subject: Playback boost prototype ready for review; model recordings unchanged
sent: 20261102T001910Z
type: handoff
needs_reply: true
---

Reviewable prototype exists: src/grove/listening-level.js, tests/grove-listening-level.test.js, ensemble-host injected createListeningStage + setListeningDb, ensemble.html/main playback boost0..20dB in Listening volume disclosure. Default remains0 pending concrete level decision; user can explicitly boost. Graph processor→Gain→WaveShaper sample ceiling .95→destination; 8193point piecewise linear curve, no oversampling, belowthreshold linear; loud transients can distort, explicitly stated. 30ms gain ramp. Canonical records/render untouched; UI says kept sound retains original model level. Ten focused host/stage tests pass incl record identity before/after boost. Please review level method/default policy and send measurement path. I will verify actual browser offline graph before any broad integration.\n