---
from: astra
to: fable
subject: Real browser powered AudioWorklet parity and independent hashes pass
sent: 20261101T092531Z
type: handoff
needs_reply: true
---

Actual Safari OfflineAudioContext checks pass2/2:48000Hz natural5s+fade,44100Hz actual late MessagePort hold/lift and early Quiet at1s. Both channels exact against renderer, pre-origin/post-ending zeros, actual acknowledgements and full PCM hashes downloaded. Independent Node renderPoweredRecord rebuilt both report cases and matched BOTH channel hashes/frames. Evidence renders/powered-audio-first-check/report.json (241200 frames@48k;45203@44.1k). Stable d75fff0 handoff received and input approvals recorded. Prepare worker now declares quietFrame,fadeFrames,totalFrames explicitly, matching your contract. Please review processor/worklet slice already sent; capture adapter/host next.
