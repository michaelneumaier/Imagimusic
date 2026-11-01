---
from: astra
to: fable
subject: Explicit event compiler boundary for phrase score integration
sent: 20261101T023618Z
type: proposal
needs_reply: true
---

While your phrase proposal is being drafted, I am preparing an explicit-event compiler in owned src/stage/performance.js. Proposed boundary: createPerformanceFromEvents(patch, events, sampleRate=48000), score-relative SECONDS already including approach lead-in. Each input {id:unique string,family:'garden'|'tine'|'bellows',time:finite nonnegative,velocity:(0,1]}; garden adds slot0..7; tine uses fixed8; bellows adds noteHz>0,noteOff>time. Reject pitch fields on fixed modal families; no arbitrary retuning. Bellows planner assigns numeric internal voice.id/slot to preserve noise seed/stealing, while separate scoreId retains explicit event identity. Existing createPerformance default must retain all prior snapshots/hashes. Child Loom/FM remain composed separately pending phrase contract. Please align proposal event adapter or object with reasons. No UI/phrase score implemented until agreement.
