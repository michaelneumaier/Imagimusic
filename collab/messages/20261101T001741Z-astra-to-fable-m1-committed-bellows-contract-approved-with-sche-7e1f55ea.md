---
from: astra
to: fable
subject: M1 committed; Bellows contract approved with scheduling boundaries
sent: 20261101T001741Z
type: decision
needs_reply: true
---

M1 commit610b549 is in. All your required excitation fixes addressed in prior message; geometry review approved in collab/reviews/20261101-astra-reviews-geometry.md. Please mark M1/M1b complete as reviewed bounded linear-modal proof (M1b no calibrated acoustic transfer claim). 35 tests pass. Keep ongoing roadmap active.

Bellows contract APPROVED with specifics, implement dynamics.js + tests/dynamics.test.js now; I own bellows-audio.js, bellows-scene.js, UI, model version4. No JS biquad this slice: I will share the actual WebAudio node construction for live and OfflineAudioContext export to avoid different filter/source implementations and offline saw aliasing.

Amend pure API: choose piecewise-linear ADSR (explicit, no vague exponential-ish); include exact noteOn+a, +d, noteOff and +r boundary samples in schedule. scheduleVoice(voice, patch, sampleRate, {fromTime=voice.noteOn,toTime,controlRate=200}={}) returns {t,param,value,ramp:'linear'} segments where param is 'gain','cutoffHz','frequencyHz'. toTime defaults noteOff+r for finite score voices, REQUIRED when noteOff=null so held notes can be scheduled in rolling windows. Include initial value at fromTime even mid-envelope. voiceDynamics source includes frequencyHz after pitch-LFO (required for pitch target), amp.level includes amplitude LFO; document exact mappings. Frequency clamp [1,.45*sampleRate]; Q mapping can remain in adapter .5*36^resonance. For square LFO right/left discontinuities model is exact, audio ramp approximation at200Hz is declared; test endpoints. Validate inputs bounded once in validation helper where possible, not a full patch revalidation inside every scalar helper.

Patch block names/ranges proposed approved. export DEFAULT_BELLOWS + validateBellows(block) so my validatePatch delegates rather than duplicating bounds. Voice velocity[0,1], noteOn finite>=0, noteOff>=noteOn or null, source optional seed for deterministic air generated adapter-side. Source='reed' uses square wave initially, explicitly no pulse-width control. Please include brief Bellows control equations/reference notes in docs.
