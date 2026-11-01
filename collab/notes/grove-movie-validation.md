# Grove movie prototype · Astra · 2026-11-01

The parallel exporter in `src/grove/export.js` takes a canonical capture, its existing saved stereo Float32 mix, and a camera position/target. It reconstructs the session and re-admits every event, checks all derived fields and gain against the capture, and computes the exact audio length (including recorded Quiet). The separate export world samples `session.visual(i/30)` at 1280 × 720, with a fixed camera angle and landscape framing. The live world and stage exporter are unchanged.

The manifest's `modelFrameHashes` cover model response and recorded strike events, not presentation-derived ring transforms, pixels, lighting or encoded bytes. Presentation metadata names the brief recorded-input rings and excludes pending held-gesture rings. Frame times remain below the exact audio endpoint; the final frame can extend less than 1/30 s beyond it. Camera: fixed fov 42, zoom 1; no camera animation.

Source audio evidence has two distinct layers: SHA-256 per planar little-endian Float32 channel, and SHA-256 of the separate saved stereo PCM16 WAV. The latter is the same WAV format the instrument saves. The full capture reconstructs the source float samples; AAC is lossy, may include padding, and its encoded bytes are implementation-dependent. The MP4 uses H.264 requested at 4 Mb/s and stereo AAC requested at 192 kb/s. The soundtrack WAV and manifest have separate download buttons; immediate back-to-back automatic downloads in Safari failed to save both artifacts, so they are separate actions.

## Prototype checks

- Focused Node tests pass for original and partials captures, complete tails and recorded Quiet, exact saved-mix sample length, arbitrary-time sampling, detached caller data, tampered gain/slot rejection, and independent source/WAV hash byte formats.
- Safari initial prototype: 61 frames, video 2.033333 s, source audio 97,200 samples at 48 kHz (2.025 s); ffprobe found stereo AAC with 2.025333 s container duration. Decoded frame at .9667 s visually inspected: all bodies/support fit, lower-tip bridges and recorded tip cue visible. This synthetic capture has three positional touches and Quiet; it is not yet a movie of a human performance.
- Source hash/WAV bundle browser run and independent Fable verification are in progress. Main-page movie action is intentionally not connected until artifact and cancellation checks are complete.

Final prototype bundle downloaded to ignored `renders/grove-movie-smoke/`: `movie.mp4`, `manifest.json`, and `imagimusic-grove-3-partials.wav`. The downloaded WAV matches its manifest SHA-256; both source-channel hashes are present. Final MP4 size 264,393 bytes. Full Node suite passed 316/316. Fable's core review cd35d79 approved subject to adding source-audio hashing; that implementation and the bundle have now been handed back for independent verification. Public-page integration remains outstanding.

## Main-page finished passage workflow

After Quiet, Make a film snapshots the capture, saved mix and camera before any asynchronous work. Film generation does not mutate transport state. The result has an inline native video preview and separate links for MP4, saved WAV and reconstruction JSON. A previous successful film remains available if a later render fails or is cancelled. The preview is labeled with its own seed, voice and duration; changing the active passage does not relabel the saved result.

Actual browser-played passage (keyboard A/S, then Quiet) is under ignored `renders/grove-movie-first-play/`. Its original `capture.json` exactly equals `manifest.json.capture`. 177,664 audio samples at 48 kHz (3.701333 s), 112 video frames (3.733333 s), 710,700-byte WAV, 260,190-byte MP4. Fable's verifier rebuilt every model-frame hash, both source-channel hashes and the WAV hash; ffprobe confirmed H.264 1280 × 720 at 30 fps and stereo 48 kHz AAC. Decoded AAC best lag 0, SNR 40.1 dB, peak difference 2.05e-4. This is codec measurement, not exact decoded-audio identity. Inline preview and all three downloads were exercised in Safari.

A longer greeting render was cancelled through the main UI. The original capture before and after cancellation is byte-identical (`renders/grove-movie-cancel-before.json` and `-after.json`); film creation became available again. The cancellation arrived near finalization, revealing a harmless encoder warning from cancelling an already finalized output; cleanup now skips cancel after successful finalization, while the abort check still prevents returning a result. A late queued click on the hidden cancel button now leaves a completed-film status intact. Fable approved the base controls in f404dc8; the two race fixes were sent for follow-up review.

Full Node suite: 318/318 before those two small cleanup changes. Independent prototype verification: Fable review 3c6f7a8. The verifier was strengthened at Astra's request so mismatched supplied container metadata affects its verdict/exit status, with separate manifest-only and full-artifact verdicts.

Deterministic browser abort at rendered frame 9 passed after the cleanup fixes: “Cancelled; no movie saved,” Render movie enabled, no WAV/manifest links enabled, and no encoder warning in the observed console. Fable approved both cleanup changes (mailbox 20261101T065441Z) and independently verified the actual played-performance bundle at the full artifact level in review 450085f. Main-page integration is now verified and ready for local use.

### Rest film integration in progress (2026-11-01 07:45 UTC)

Rest v2 captures now enter the movie plan through recipeForRecord/restMovieSource (schema and energy admission reconstruction). A worker prepares the full model timeline before browser encoding. Contact rings use the recorded zone/strength, matching Rest's live picture; original/richer Grove paths remain supported. Controls accept deferred saved PCM while freezing capture/camera synchronously. Seven focused capture/replay/movie tests pass.

Actual Safari Rest page: recorded two strikes and a held hand, then Make a film succeeded. Bundle: renders/rest-movie-first-play/{manifest.json,movie.mp4,sound.wav}; 30 video frames,47408 source samples at48kHz,0.9876667s audio. Extracted contact-frame.png at0.4s visibly shows the hand ring on body1. A second render cancelled in worker preparation, preserving the prior film and capture; capture-after-cancel.json equals manifest.capture.

Independent verification initially FAILED because Fable concurrently changed strength serialization from names to coefficient objects in v2; the browser artifact used the already-shipped name format. Legacy compatibility requested, not yet verified at this checkpoint. New capture producer now writes explicit {name,c}; recipeForRecord must interpret older names using their historical default coefficients. Do not treat the rendered artifact alone as completed verification. Fable also owns the independent verifier update and review.

### Rest film verification complete (2026-11-01 07:47 UTC)

The compatibility failure above is resolved by Fable's95e6c48: old bare strength names retain historical default coefficients; new records store explicit name/coefficient objects. Both Astra and Fable ran the independent verifier on the actual older-format film bundle: VERIFIED at manifest, soundtrack and container level. All30 model hashes match;47408 source samples/ch and WAV bytes match; H2641280x720/30fps and AAC48k stereo checks pass. Decoded AAC best lag0, SNR38.6dB, peak difference3.05e-4: lossy measurement, not identity. Fable integration/artifact review approved22dcb32.

Fresh real AudioContext check with explicit strengths also passed: renders/grove-contact-live-explicit-strengths-report.json generated07:45:51.356Z. Astra rebuilt its recipe from the record alone, rechecked admission and matched both source PCM hashes. Full local suite350/350passed in38.58s. Astra's reconstruction review: collab/reviews/20261101T0747Z-astra-reviews-rest-record-reconstruction.md. Rest film implementation is7cc3001; replay is3481f0c.
