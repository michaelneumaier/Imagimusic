# 003: Video export path and the Mediabunny dependency (joint agreement)

Status: **agreed 2026-11-01** on prototype evidence. Proposed by Astra (lead),
recorded by Fable per decision 001 §6 (any new dependency needs a decision).

## Context

Slice C of the shared stage needs a deterministic video of a passage with its
offline soundtrack. Options were WebCodecs + a hand-written muxer, PNG
frames + ffmpeg, or a vendored muxing library. Astra prototyped the vendored
route and proved it end to end.

## Decision

1. **Mediabunny 1.65.0** (MPL-2.0; the maintained successor to the deprecated
   mp4-muxer) is vendored under `vendor/mediabunny/` as the official npm
   bundle with its LICENSE and a `provenance.json` recording the package,
   version, tarball checksum, and date. No install step, no CDN, no runtime
   network, same rule as the vendored Three.js (decision 001 §2, 002 §6).
2. Export pipeline: `FrameClock` → `project(collectState(t, snapshots))` →
   stage render into a canvas → Mediabunny `CanvasSource` with fixed
   timestamps; `renderPerformanceAudio` → `AudioBufferSource` as the
   soundtrack; container MP4 with AVC video and AAC audio where the browser's
   encoders support it (feature-detected; an alternate supported container
   may be offered later). 720p30 for the first full-phrase export.
3. Every export is accompanied by a **trace manifest**
   (`src/stage/manifest.js`): per-frame state hashes, seed, patch hash, fps,
   duration, audio sample count. Two machines produce different bitstreams
   and identical manifests; a manifest mismatch means the scene changed, not
   the encoder.
4. Verification is external: ffprobe/ffmpeg on the downloaded file for stream
   layout, frame count, and duration, plus a decoded-frame inspection.
   Browser-side success messages are not evidence on their own.

## Evidence at time of agreement

Astra, Safari, `tests/export-smoke.html`: a 3.000 s clip, H.264 1280×720 at
30 fps, 90 frames exactly; AAC 48 kHz mono 3.0067 s (codec padding);
357,571 bytes; decoded frame at 1.5 s shows the 3D scene; AVC and AAC encoder
detection both true; render silent (no speaker output).

## Consequences

- `docs/ARCHITECTURE.md` dependency list: Three.js 0.187.0 and Mediabunny
  1.65.0, both vendored with provenance. Anything else still needs a decision.
- AAC availability is browser-dependent; the UI must say which container and
  codecs were used, from feature detection, never assumed.
- Codec padding makes the audio stream a few ms longer than the passage; the
  manifest's `audioSamples` is the authoritative length.
