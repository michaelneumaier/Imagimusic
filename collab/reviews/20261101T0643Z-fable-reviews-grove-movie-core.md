# Review: Grove movie core (Astra, working tree: `src/grove/movie-plan.js`, `export.js`, `world.js` fixed-size option, `tests/grove-movie-plan.test.js`)

Reviewer: Fable. Date: 2026-11-01. Focused test passes here (both capture kinds, full tail and Quiet, seek-order invariance, detached input, tampered gain and slot rejected). Browser smoke harness next (Astra).

## Verdict: approve-with-one-fix (the manifest must carry a hash of the source PCM)

## What is right
- **The record is rebuilt, not trusted.** The plan recreates the session
  from the capture's canonical grove (and voice), re-admits every event
  through `strike`, which derives `strikeU` and `bufferIndex` itself,
  finishes with the recorded Quiet, and requires the reconstructed snapshot
  to equal the capture under a key-sorted stringify; a changed gain or a
  changed slot is rejected (tested). Inputs are cloned.
- **Sample count is the session's.** `audioSamples = min(max(frame +
  ceil(ring · sr)), ended.frame + fadeFrames)` equals the saved mix length
  (asserted against the session's own PCM in the test), so the movie's
  soundtrack is the saved WAV to the sample.
- **Frame clock and hashes.** Times from `FrameClock.times(duration)`, hashes
  of `session.visual(t)` (envelope with the Quiet fade, strike events), and
  `hashScope` says plainly it is model response and strike events, not
  pixels or codec bytes; the export re-checks each frame's hash while
  rendering and fails if the model drifted. Past the audio end the state
  is the settled fade, and the manifest says the last frame may outlast
  the audio by under a frame.
- **Camera.** `fov 42, zoom 1` matches the world at 16:9 (`zoom = min(1,
  aspect/1.45)` is 1 at 1.78); damping is off, so the frozen pose is the
  pose. The fixed-size world sets pixel ratio 1 and never reads the DOM
  rect; the live path is unchanged.
- **Export.** Stereo AAC at 192 kb/s from the supplied Float32 mix, H.264
  at 4 Mb/s, a separate world and sculpture disposed in `finally`, cancel
  stops both tasks and cancels the output.

## Should fix: hash the soundtrack
`validateGroveMovieAudio` checks rate, channel count, length and finiteness
only, and the manifest has no audio hash, so a Node verifier that rebuilds
the PCM from `manifest.capture` has nothing to compare against except the
lossy AAC. Add `audioHash` (the `traceHash` of both channels, or a SHA-256
of the Float32 bytes) computed from the PCM at export time; the verifier
rebuilds from the capture through the same factories and compares. That
closes pin 1 of the contract review; pin 2 (the WAV beside the MP4) is
page integration.

## Nits
- `capture.events.length > 128` duplicates the session's capacity constant;
  read it from one place if the session exports it.
- `onProgress` yields every 8 frames; at 61 frames the smoke harness will
  see about eight updates, fine for a 2 s capture, say so for a 2-minute one.
