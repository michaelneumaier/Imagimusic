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
source finished during rendering differed run-to-run, with differences
observed after the first source finish (the harness reports the location
of the MAXIMUM difference, not the first differing sample: lone strike
maximum at 10.0294 s with the first mode stop at 10.0289 s, about 24
samples later; damped lone strike maximum at 1.2188 s with the stop at
1.2184 s; some v5 maxima later still), and every never-stopped control was
bit-identical over 12 s, garden included. The drift magnitude varied
between runs by three orders (6e-8 to 2.3e-5), i.e. it is timing-dependent.
Earlier hypotheses (summation-order rounding floor, node collection,
disconnect timing) did not explain all controls and were set aside; they
were not each individually disproven. The source-finish relationship is
strong and controlled; the exact onset of divergence and the mechanism
inside the engine are **not established** by these metrics.

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

## Scope extension (2026-11-01, composed passages)

With the optional Loom duet attached (composition v1), the duet's
AudioBufferSource ran out of buffer before the render ended and the composed
passage drifted (harness v9: difference after the buffer end at 31.064 s,
peak at 31.255 s; the first v9 failure stays documented). The fix zero-pads
the duet buffer past the stop time under the outlive policy, content
unchanged. Verified on Safari 26.6.2 / 48 kHz / seed 731, three arrangements
rendered twice each, all bit-identical float32 (1,609,893 samples, finite,
bounded, tail below 3e-6, non-zero contribution vs. the base passage):
matched default (peak 0.2077), detuned 339 Hz / coupling 0.02 / −33 cents /
loss 0.8 (peak 0.1949), uncoupled 80 Hz / loss 0.2 (peak 0.1922)
(`renders/loom-render-report-20261101T015618.json`). The verified set is
exactly these; other arrangements are expected but not claimed.

## Scope extension (2026-11-01, featured FM tensioner, composition v2)

With the single featured FM tone attached (entrance at beat 8, PCM from the
model at the context's rate, buffer padded past the render under the
outlive policy counted from its start offset), harness v11 on Safari 26.6.2
/ 48 kHz / seed 731: FM alone and FM with the Loom duet each rendered twice,
bit-identical float32 (1,609,893 samples), peaks 0.1941 / 0.2077, RMS
0.0304 / 0.0340, tails below 3e-6
(`renders/stage-render-report-v11-731-20261101T023310.json`). The combined
movie `renders/conservatory-fm-loom-731.mp4` verifies 1007/1007 with the
saved v2 composition. The verified set is exactly these two arrangements with
the default FM settings; the isolated before/after contribution check (v13
focused) is a separate, still-open diagnostic; other FM settings are expected
but not claimed.

## Consequences

- `docs/ROADMAP.md`: the repeatability item closes with this evidence.
- A future engine, OS, or browser change that breaks identity fails the
  harness's shipping assertion loudly; the negative controls then say where.
