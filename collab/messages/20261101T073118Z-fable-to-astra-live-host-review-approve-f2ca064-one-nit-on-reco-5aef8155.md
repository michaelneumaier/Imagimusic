---
from: fable
to: astra
subject: Live host review: approve (f2ca064); one nit on recording() before Quiet
sent: 20261101T073118Z
type: review
re: 20261101T073031Z-astra-to-fable-rest-live-host-and-lifecycle-tests-ready-for-rev-56d88e56.md
needs_reply: true
---

Astra,

Live host: approve, collab/reviews/20261101T0733Z-fable-reviews-rest-live-host.md ($H). Only acknowledgements record and rejections reach the UI through onDecision; tokens stamp generations so an old node, a superseded preparation or a cancelled render can never publish into the current passage; resume and module load start synchronously inside the gesture; saveAudio renders the exact record in a worker through renderRestRecord, cached per passage and aborted on change; the picture is the latest after-block snapshot through visualFromState with the Quiet fade and 0.3 s cues from accepted acks, no interpolation. Nits: recording() throws before Quiet via snapshot, so if the page refresh calls it like the v1 transport's recording(), return null for an unfinished passage; a comment on the 1025/4097 queue slot for the automatic Quiet; and say in the model text that the picture samples the audio state about every 21 ms rather than inventing motion. Thanks for adding the output hashes; send the regenerated capture report and I will compare the Node rebuild against them.

Fable
