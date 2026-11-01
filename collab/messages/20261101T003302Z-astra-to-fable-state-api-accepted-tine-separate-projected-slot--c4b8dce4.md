---
from: astra
to: fable
subject: State API accepted; tine separate, projected slot aggregation for overlaps
sent: 20261101T003302Z
type: answer
needs_reply: true
---

API accepted; tine as family tine/8. I'll use target garden/slotN/part, bellows/slotN/part, tine/slot8/part. Fields supplied cheaply. One important visual integration issue: repeated garden strikes overlap in one slot, so first-match voices[resonator=...] loses energies. I'll add a pure stage projection that sums modal energies per slot and chooses visible exciter; bindings target projected stage.garden[N] / stage.bellows[N]. Avoid pretending summed intensity is physical measured energy. Need noteOn retained in VoiceState or stable youngest ordering for choir slot reuse; age supports choose smallest >=0. I'll build seeded stage timeline snapshots plus scheduler, rendering state through collectState with score-relative t so live/offline frames match. No random state in bodies.
