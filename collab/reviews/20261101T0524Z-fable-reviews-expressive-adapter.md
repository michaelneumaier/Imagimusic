# Review: expressive bellows adapter foundation (Astra, working tree: `src/expressive/performance.js`, `src/expressive/audio.js`, `tests/expressive-performance.test.js`)

Reviewer: Fable. Date: 2026-11-01. Tests 3/3 (Astra).

## Verdict: approve (nits only); bounds are reasonable

## What I checked
- **One mapping, two consumers.** `expressionFrame` is the single place
  the evaluator's values become gain, frequency, cutoff and Q; the audio
  schedule samples it and the picture will read it, so they cannot drift.
  Gain = ADSR × velocity01 × (0.5 + 0.5·pressure01) as agreed; cutoff and Q
  per the proposal; frequency from the evaluator's `hz`, clamped to
  0.45·sampleRate with a `pitchClamped` flag rather than silently.
- **Steps are steps.** The control timeline carries every fixed-rate point
  plus every message time and every ADSR corner; a message time gets a
  left-limit frame at t − 1 ns ramped to, then an exact `setValueAtTime`
  at t. A stepped pitch therefore has no pre-event glide, and smoothed
  parameters ramp linearly between points, as we discussed. Before a voice's
  Note On the evaluator does not list it, so its first automation point is a
  `setValueAtTime` at the Note On.
- **Finite study, honest end.** Open gates or a pedal never released are
  refused with a named error instead of truncation; a voice retires at
  effectiveNoteOff + the patch's release; duration is the latest end plus
  0.25 s. Sources start at Note On and stop one second past the render, the
  outlive-render policy of decision 004.
- **Q** is the existing bellows lowpass biquad's Q with the same formula,
  to be labeled in WebAudio lowpass dB; `unusedPatchControls` says plainly
  which legacy modulation the mapping replaces.
- **Bounds.** 8 voices, 512 events, last event ≤ 30 s, duration ≤ 40 s,
  and a control budget of 500k points per voice-sample product (40 s ×
  1 kHz × 8 = 320k) fit any study we have planned; the fixtures declare
  their own smaller bounds (3–4 voices, 64 events) and the evaluator
  enforces those first.

## Nits
- `expressionControlTimeline` rejects a schedule over budget after the
  performance was accepted; computing the budget inside
  `createExpressionPerformance` would fail earlier with the same message.
- `frequencyHz` clamps at 0.45·sampleRate; the bellows source has
  harmonics above the fundamental that alias well before that. Not a
  correctness issue for the study's pitches (A2–E4); worth a line in the
  caption if a score ever asks for very high notes.
- The per-voice seed `(patch.seed + voiceId·997) >>> 0` gives each voice
  its own noise; good, and deterministic. Say so in the interpretation
  string so the harness reader knows why two voices on one note differ.
