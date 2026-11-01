# 004: Repeatable offline audio (joint agreement)

Status: **agreed 2026-11-01** on harness evidence. Investigated by Fable and
Astra; wording approved by Astra (lead).

## What is verified

Two consecutive offline renders of the Conservatory passage (seed 731,
48 kHz, 1,609,893 samples, 33.54 s) are **bit-identical float32** with the
default patch and with the air choir, through the native compressor, on
Safari 26.6.2 (harness v6 report
`renders/stage-render-report-v6-731-20261101T012811.json`). Peak 0.194,
RMS 0.0295 (air: 0.168 / 0.0263), last 50 ms below 3e-6, length equal to the
passage duration. The state trace manifest was already deterministic.

## The controlled finding

Across harness versions 3–6 on the same machine: every render in which a
source finished during rendering drifted run-to-run, beginning within one
sample of the first finish (lone strike 10.029 s vs. first mode stop
10.029 s; damped lone strike 1.2188 s vs. 1.2184 s); every render in which
no source finished was bit-identical over 12 s, garden included; the drift
magnitude varied between runs by three orders (6e-8 to 2.3e-5), i.e. it is
timing-dependent. Earlier attributions (summation-order rounding floor,
node collection) were retracted when evidence refuted them. The mechanism
inside the engine is **inferred, not proven**.

## Decision

1. `renderPerformanceAudio` defaults to `sourceLifetime: 'outlive-render'`:
   every source's stop is scheduled at `renderEnd + 1 s`, applied after all
   events (so a steal cannot re-finish a source), and the engines set each
   gain to exactly 0 at its intended end (garden: `setValueAtTime(0, cutoff)`
   after the exponential ramp; choir: linear ramp to 0 at release end), so
   no residual sounds. Live playback is unchanged.
2. `'as-live'` remains an explicit diagnostic control. The browser harness
   reports negative controls (as-live rows, engine baselines) separately
   from shipping assertions and never relaxes their comparisons.
3. **No promise is made** of cross-browser identity, cross-machine
   identity, or codec byte identity. The MP4's AAC stream is encoded from
   float32 and is lossy; the repeatable artifacts are the float32 render and
   the trace manifest. The WAV export is 16-bit and identical when the
   float32 render is.
4. Shipping assertions (harness ≥ v6): full and air renders bit-identical,
   peak within (0.01, 1), last 50 ms below 1e-3, length equal to duration.

## Consequences

- `docs/ROADMAP.md`: the repeatability item closes with this evidence.
- A future engine, OS, or browser change that breaks identity fails the
  harness's shipping assertion loudly; the negative controls then say where.
