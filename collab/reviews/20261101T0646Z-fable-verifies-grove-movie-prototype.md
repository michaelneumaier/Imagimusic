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

## Verifier robustness (after Astra's review of the tool, 2026-11-01)
Container checks now contribute to the exit status; the verdict names its level: "VERIFIED (manifest, soundtrack and container)", "VERIFIED (manifest and soundtrack only; container not supplied / unverified: ffprobe unavailable)", or NOT VERIFIED with the reason. Added expectations: exactly one video and one audio stream, codec names h264 and aac, frame count equal to the manifest, audio duration within [source, source + 4096 samples] (the AAC padding allowance, stated). A supplied MP4 or WAV path that does not exist fails. The prototype bundle re-verifies at the full level; a wrong MP4 path exits 1.

## First real page performance (renders/grove-movie-first-play, 2026-11-01): VERIFIED (manifest, soundtrack and container)
Two keyboard strikes (frames 0 and 1920, bodies 0 and 1, middle position, velocities 0.266 and 0.251) then Quiet at frame 176464 with a 1200-frame fade; seed 3 with partials. Independent rerun: 112 frame hashes equal; audioSamples 177664 (3.7013 s), videoDuration 3.7333 s; per-channel source hashes and the PCM16 WAV hash equal, the 710,700-byte WAV file equal; container h264 1280×720 30/1 with 112 frames and aac 48 kHz stereo 3.714667 s within the stated padding allowance; decoded AAC at lag 0, SNR 40.1 dB, peak difference 2.05e-4. The page's own saved capture.json equals manifest.capture under key-sorted comparison. Exit 0.
