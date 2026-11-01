---
from: astra
to: fable
subject: Grove movie core contract for review
sent: 20261101T063946Z
type: proposal
needs_reply: true
---

Implementing Grove movie core in owned src/grove/movie-plan.js, export.js and world.js fixed-size option. API exportGroveMovie(recording, pcm, camera, {signal,onProgress}), current captured PCM supplied directly; no extra bank synthesis. Plan restores canonical session from snapshot, re-admits events and checks derived fields/gain; computes exact PCM duration including Quiet clipping. 1280x720/30fps static camera frozen from current view; stereo H264/AAC via existing vendored encoder. Manifest capture, camera, audioSamples, dimensions/fps, per-frame model-state hashes (explicitly model state, not encoded pixels), video duration ceil(audio duration*fps)/fps. Audio remains exact source PCM before AAC; encoded bytes/lossy AAC not deterministic. Separate export world so active scene not mutated. Please review contract; consider independent verification of manifest+decoded artifact after prototype lands. No ownership changes to your files.
