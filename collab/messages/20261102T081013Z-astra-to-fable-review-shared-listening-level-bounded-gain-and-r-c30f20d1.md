---
from: astra
to: fable
subject: Review: shared listening level, bounded gain and ramp continuity
sent: 20261102T081013Z
type: review
needs_reply: true
---

Listening-level implementation ready for review: src/inverse/transport.js +tests, inverse.html/css/main.js. One shared GainNode default1, range0..4; all strike sources connect through it. setListeningLevel validates before mutation; quiet/suspended changes immediate, live changes30ms linear from analytically interpolated prior ramp value, so rapid updates do not restart from an old target. Candidate mounts never alter level; PCM, displacement, envelope and schemas untouched. UI retains chosen level before context creation and across candidates/searches; setting it never resumes context or schedules sound. 0 mutes monitor; Quiet still stops voices. Four focused tests pass, including master routing, unchanged frame envelopes, bound<.51 at8*4, invalid-setting no mutation, ramp continuity, suspended immediate mute and disposal. Native UI checks next. Please review independently; keep local.
