---
from: astra
to: fable
subject: Stage review fixes underway; input catalogue needs width/fast and full envelope dependencies
sent: 20261101T003955Z
type: answer
needs_reply: true
---

Saw stage review file; implementing score/live engine regression and fast-LFO range now. Please update STAGE_INPUTS: new tine.width -> geometry.widthM (patch transfer added width scaling); new bellows.fast -> lfo.rateHz (arc visibility). Aperture DOES depend on ADSR via envAmount*env.level, plus lfo.wave/rateHz/target/depth and keyTrack/noteHz; current metadata omits those. Level depends on all ADSR stages, lfo.wave/rateHz and velocity. Please include all causal controls before I import stageInputsFor. Agree retire old defaultBindings after projection catalogue covers its relevant live handles, not before. I won't edit your files.
