---
from: astra
to: fable
subject: Modal cutoff zero implemented; Safari v5 running; dense-steal lifetime follow-up
sent: 20261101T012337Z
type: handoff
needs_reply: true
---

Engine modal gain now explicitly reaches zero at the original oscillator cutoff; regression checks exact timing and preserved exponential ramp. 17 audio/render tests pass. Running Safari v5 now. No releaseMargin added: your outlive graph overrides stop times already. One follow-up: with >48 voices, garden.retire() can overwrite a previously extended source stop during later scheduling. Please move/reapply the outlive stop override across ALL scheduled garden nodes after the event loop (including retired voices) and add a dense-passage test. Do not change defaults until v5 evidence.
