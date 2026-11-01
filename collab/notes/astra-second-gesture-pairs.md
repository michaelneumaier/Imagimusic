# Second-gesture timing audition

2026-11-01 · Astra · local experiment, no production sound or new guide instruction

Artifact: http://127.0.0.1:8080/renders/second-gesture-pairs/

Reproduce from Fable's exact-frame timing helpers:

```
node tools/render-timing-pairs.mjs --measure renders/second-gesture-pairs
```

Or rebuild an already selected source without rerunning its sweep:

```
node tools/render-timing-pairs.mjs renders/second-gesture-pairs/source.json renders/second-gesture-pairs
```

The tool renders two complete records per Grove. Each pair must share the model, strike attributes and ending fade, have exactly two strikes and no contacts, and start at frame zero. Only timing may differ. It validates actual admission, asserts measured-frame equality in generated pairs, preserves source/record JSON, and writes natural-level PCM16 WAVs plus a hash/measurement report. No RMS matching, boost or limiter. A/B ordering alternates minimum/maximum sampled pickup ratio across Groves, with labels concealed until explicitly revealed. This is informal audition, not randomized perceptual testing.

## Verified artifact

| Grove | A second-strike frame | B second-strike frame | A duration | B duration |
| --- | ---: | ---: | ---: | ---: |
| 3 | 24137 | 22514 | 4.527854 s | 4.494042 s |
| 7 | 132681 | 14400 | 6.789187 s | 4.325000 s |
| 11 | 26799 | 35656 | 4.583312 s | 4.767833 s |

All are 48 kHz. Independent Python wave/struct/hashlib checks matched six WAV hashes, stereo/sample rates/frame counts, complete source records, second-strike frames and PCM16 RMS within quantization error. The targeted exact-frame second-gesture test passed (1/1). Safari at 320×656 showed six labeled A/B buttons with no autoplay or condition reveal initially. Switching Grove 7 A→B left one native player on B; restarting A then Quiet left Play at time zero. Clicking the visible reveal disclosed the conditions. This verifies transport/UI, not subjective listening.

Selection measures body 1's low-band pickup RMS during one second beginning one second after the second strike, relative to a single strike over the same window. The whole-file RMS in the report uses a different interval and duration. Grove 7's maximum selected ratio has a lower whole-file RMS than its minimum-ratio version, so the labels must not mean louder overall or better music. Delay changes carrier phase and decay as well as the slow beating; visible swell/dip timing is not established as a predictor.

## Review state

Astra requested exact-frame preservation and tempered interpretation in collab/reviews/20261101T0846Z-astra-reviews-second-strike-draft.md. Fable's committed ce2dc2e code uses exact frames for both authoring and measurement and reports the pre-strike envelope separately; the original rounding discrepancy is resolved in these artifacts. Fable independently approved the tool in collab/reviews/20261101T0853Z-fable-reviews-timing-pairs.md: all six WAVs match a fresh record rebuild, and a fresh sweep matches all selected frames. An additional negative-input check changed one second-strike strength and confirmed rejection before any WAV was written. Initial build failed during the concurrent API transition and produced no artifact; the successful build above consumes the new object argument `{frame}` directly.
