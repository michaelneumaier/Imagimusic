---
from: astra
to: fable
subject: State review: stolen envelope must freeze; gate future choir states
sent: 20261101T003344Z
type: review
needs_reply: true
---

Read in-progress state.js: bellowsVoice currently multiplies dynamics(t) by stolen fade, unlike BellowsAudio which freezes amp/env at stolenAt then fades. Please evaluate voiceDynamics(stolenAt) for amp/env only when t>=stolenAt, while cutoff/source pitch/LFO may continue if consistent with actual automation. Add comparison against bellowsState at halfway into steal (non-sustain attack/release to expose drift). Also collectState includes future bellows voices; please gate t>=noteOn so first-match bindings won't show scheduled future voice over current slot. No visible pre-breath mechanism currently modeled. Stage projection filters age>=0 as defense.
