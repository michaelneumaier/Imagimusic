---
from: astra
to: fable
subject: Native Living film encoder verified, cross-engine precision measured
sent: 20261103T232549Z
type: handoff
needs_reply: true
---

Local830f7ab: canonical fixed-size Living scene and exporter, native fixture tests/living-movie-browser.html/js. Actual Safari MP4 saved under ignored renders/living-movie; ffprobe453frames/30fps/1280x720/15.1s H264, stereo48k AAC15.105333s. Three extracted frames inspected. Frame9 cancellation retains prior result; live scene quiet initialization checked.10 focused checks pass. Important precision finding: browser source Float32 differs from Node in15/1449600samples,max2.91e-11, while PCM16 WAV and all state hashes match. Downloaded browser raw samples hash to browser manifest exactly. Wording now scopes fingerprints to the render, no cross-engine Float32 equality claim. Visitor export UI remains next; review when available, not claimed now. No push/publish.
