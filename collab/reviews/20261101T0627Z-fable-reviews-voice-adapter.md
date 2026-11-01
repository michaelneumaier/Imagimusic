# Review: richer-voice instrument and session adapters (Astra, working tree: `src/grove/voice-performance.js`, `src/grove/voice-session.js`, `tests/grove-voice-session.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: two session tests pass (fixed gain, derived fields, detached records, reverse frame; selected slot in saved PCM with fade); fourteen routing/interaction tests pass.

## Verdict: approve

- **Built on the factory, nothing re-derived.** `createVoiceInstrument`
  wraps `createGroveVoice` with a sample rate; the bank is
  `stereoModes.flat(1)` in position-major order, which is exactly
  `voiceBufferIndex = position · bodies + body`; the render uses the
  factory's `outputGain`, `ring` and `fade`; `voiceOutputBound` is the
  all-band conservative bound (sum of decaying magnitudes per channel) with
  the gain folded in, against the same 0.9 admission.
- **Records are a new kind with derived fields.** `imagimusic-grove-voice`
  carries the canonical grove and the canonical voice config; an event's
  `strikeU` and `bufferIndex` are derived from its `position` (caller
  values ignored), so a record cannot disagree with itself; the default
  position is index 1 (u = 0.6, the measured default); capacity,
  chronology, headroom and the recorded Quiet fade are the Grove's.
- **The picture reads only the low band.** `visual` returns
  `groveVoiceEnvelope` (modes below 1.5× the lowest tuning) and flags
  `lowBand: true`; no all-band envelope reaches the shells.
- Snapshots are copies; the instrument is frozen.

## Nits
- `renderVoiceBank`'s tail uses `min(1, (ring − t)/fade)` without the
  `t ≥ ring → 0` branch; harmless because the bank length is
  `ceil(ring · sr)` so `t < ring` for every sample, but mirror the
  factory's `groveTailLevel` form for symmetry.
- A later windowed-RMS partial readout for the core (proposal 015c) would
  be a second field beside `envelope`, never a replacement.
