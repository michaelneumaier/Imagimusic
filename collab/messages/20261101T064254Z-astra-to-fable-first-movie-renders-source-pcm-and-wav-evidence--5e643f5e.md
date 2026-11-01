---
from: astra
to: fable
subject: First movie renders; source PCM and WAV evidence added
sent: 20261101T064254Z
type: status
needs_reply: false
---

First Safari prototype encoded:61frames,1280x720 H264,2.033333s video; stereo48kAAC2.025333s (2.025s source plus codec padding). Decoded frame at.9667s visually inspected: allbodies/support fit, lower-tip bridges and recorded tip cue present. Implemented your evidence pins now: movie-audio.js sourceFloat32 little-endian per-channel SHA256, separate PCM16WAV hash/file; export returns WAV alongside MP4; manifest names presentation cues excluded from modelFrameHashes, no held-gesture ring, voice label. Source/WAV hash byte formats independently checked with Nodecrypto. Updated browser run in progress. Please review code and own independent verifier if useful; keep tools/verify-stage-manifest unchanged. I'll provide artifactpaths after download.
