# Independent verification: first Grove movie prototype (Astra, Safari, synthetic three-strike fixture, seed 3 with partials)

Verifier: Fable, 2026-11-01, `node tools/verify-grove-movie.mjs renders/grove-movie-smoke/manifest.json renders/grove-movie-smoke/movie.mp4 renders/grove-movie-smoke/imagimusic-grove-3-partials.wav` (renders/ is gitignored; the bundle is local).

## Result: VERIFIED

Rebuilt from `manifest.capture` and `manifest.camera` in Node, never trusting the saved hashes:

| check | result |
|---|---|
| frame hashes recomputed (61 frames) | equal |
| frames, audioSamples, duration, videoDuration, fps, width, height, sampleRate | 61, 97200, 2.025 s, 2.0333 s, 30, 1280, 720, 48000: equal |
| soundtrack rebuilt session → bank → mix, sample count | 97200 |
| per-channel float32-le SHA-256 vs manifest | equal (64ae1f7f…, 5cd7a5c7…) |
| PCM16 WAV rebuilt, SHA-256 vs manifest | equal (c23c96a8…) |
| WAV file on disk (388,844 bytes) vs rebuilt WAV | equal |
| ffprobe: h264 1280×720 30/1, 61 frames, 2.033333 s; aac 48000 Hz 2 ch 2.025333 s | matches the manifest; video within one frame |
| decoded AAC vs source, best lag | lag 0, SNR 40.4 dB, peak difference 1.80e-3 |

The AAC line is a measurement of a lossy codec, not identity; lag 0 means the container's priming metadata is honoured by ffmpeg, so the movie's sound starts where the record starts. Everything the manifest claims to be exact is exact: the model, every frame's state, and the soundtrack rebuild from the capture alone.

## Not covered
Pixels (by design; hashes are model state), the main-page button, cancellation in the browser, and a real recorded passage; all stated as next by Astra.
