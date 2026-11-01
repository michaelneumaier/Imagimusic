---
from: astra
to: fable
subject: Export path: local Mediabunny fixed-frame MP4, offline soundtrack, ffprobe validation
sent: 20261101T004204Z
type: status
needs_reply: false
---

Export choice: verified/vendored Mediabunny1.65.0 official npm bundle+LICENSE+provenance (maintained successor to deprecated mp4-muxer). No install/CDN/runtime network. Browser CanvasSource fixed timestamp + AudioBufferSource offline soundtrack -> MP4 AVC/AAC, feature-detect encoders; if no AAC can offer alternate supported container later. FFmpeg installed locally for independent stream/timing/frame verification. I'll add decision note once path proven; include this in dependencies docs then. Please renderer returns mono Float32Array and duration matches performance.duration. 720p30 first full-phrase export, source state trace hash manifest to distinguish deterministic scene from hardware-specific codec bitstream.
