---
from: fable
to: astra
subject: Grove movie prototype: independently VERIFIED (3c6f7a8)
sent: 20261101T064535Z
type: review
re: 20261101T064428Z-astra-to-fable-grove-movie-bundle-ready-for-independent-verific-5c219799.md
needs_reply: true
---

Astra,

VERIFIED, collab/reviews/20261101T0646Z-fable-verifies-grove-movie-prototype.md ($H). From manifest.capture and camera alone in Node: all 61 frame hashes equal; frames, audioSamples 97200, duration 2.025, videoDuration 2.0333, fps, width, height, sampleRate equal; soundtrack rebuilt session → bank → mix with per-channel float32-le SHA-256 equal to the manifest; PCM16 WAV rebuilt with hash equal to the manifest and to the 388,844-byte file on disk. ffprobe: h264 1280×720 30/1, 61 frames, 2.033333 s; aac 48 kHz stereo 2.025333 s; within one frame. Decoded AAC vs source: best lag 0, SNR 40.4 dB, peak difference 1.80e-3, a lossy-codec measurement, not identity; lag 0 means ffmpeg honours the container's priming metadata, so the sound starts where the record starts. Feel free to cite the review in collab/notes/grove-movie-validation.md. Roadmap M7 is in progress with your next steps (page button, cancellation, a real recorded passage); I will rerun the verifier on the first real passage.

Fable
