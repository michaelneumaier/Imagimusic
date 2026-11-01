# Grove movie prototype · Astra · 2026-11-01

The parallel exporter in `src/grove/export.js` takes a canonical capture, its existing saved stereo Float32 mix, and a camera position/target. It reconstructs the session and re-admits every event, checks all derived fields and gain against the capture, and computes the exact audio length (including recorded Quiet). The separate export world samples `session.visual(i/30)` at 1280 × 720, with a fixed camera angle and landscape framing. The live world and stage exporter are unchanged.

The manifest's `modelFrameHashes` cover model response and recorded strike events, not presentation-derived ring transforms, pixels, lighting or encoded bytes. Presentation metadata names the brief recorded-input rings and excludes pending held-gesture rings. Frame times remain below the exact audio endpoint; the final frame can extend less than 1/30 s beyond it. Camera: fixed fov 42, zoom 1; no camera animation.

Source audio evidence has two distinct layers: SHA-256 per planar little-endian Float32 channel, and SHA-256 of the separate saved stereo PCM16 WAV. The latter is the same WAV format the instrument saves. The full capture reconstructs the source float samples; AAC is lossy, may include padding, and its encoded bytes are implementation-dependent. The MP4 uses H.264 requested at 4 Mb/s and stereo AAC requested at 192 kb/s. The soundtrack WAV and manifest have separate download buttons; immediate back-to-back automatic downloads in Safari failed to save both artifacts, so they are separate actions.

## Prototype checks

- Focused Node tests pass for original and partials captures, complete tails and recorded Quiet, exact saved-mix sample length, arbitrary-time sampling, detached caller data, tampered gain/slot rejection, and independent source/WAV hash byte formats.
- Safari initial prototype: 61 frames, video 2.033333 s, source audio 97,200 samples at 48 kHz (2.025 s); ffprobe found stereo AAC with 2.025333 s container duration. Decoded frame at .9667 s visually inspected: all bodies/support fit, lower-tip bridges and recorded tip cue visible. This synthetic capture has three positional touches and Quiet; it is not yet a movie of a human performance.
- Source hash/WAV bundle browser run and independent Fable verification are in progress. Main-page movie action is intentionally not connected until artifact and cancellation checks are complete.

Final prototype bundle downloaded to ignored `renders/grove-movie-smoke/`: `movie.mp4`, `manifest.json`, and `imagimusic-grove-3-partials.wav`. The downloaded WAV matches its manifest SHA-256; both source-channel hashes are present. Final MP4 size 264,393 bytes. Full Node suite passed 316/316. Fable's core review cd35d79 approved subject to adding source-audio hashing; that implementation and the bundle have now been handed back for independent verification. Public-page integration remains outstanding.
