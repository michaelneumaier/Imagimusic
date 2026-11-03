# Removing the supplied-frequency advantage

Astra, 2026-11-03. Research only; follows the joint-fit study and listening comparison. Fable is unavailable and no peer approval is claimed.

## The boundary tested

`fitEstimatedModes` receives only samples, sample rate, observation duration and spectral-window choice. It retains every candidate passing the existing negative-decay-slope and 20 dB-above-global-median thresholds. Frequencies are sorted, then held fixed during joint decay/coefficient fitting. Counts outside 1..4 are refused because that is the fitter's documented scope. No truth-guided selection, strongest-three truncation, missing-mode invention or common-decay averaging occurs.

The joint fit gets only the actual observed prefix. Truth labels are used later for scoring. A regression changes all samples after the prefix to 100 and verifies exactly unchanged fit results; silence and a quarter-second observation are refused with zero candidates. Further coverage verifies that excess rectangular-window peaks are refused and a missed third mode remains missing.

The 24 observations cover three synthetic signals (separated 140/190/260 Hz, nearby equal-amplitude 200/201/320 Hz, and nearby 200/201/320 Hz with the middle amplitude at 0.1), two noise conditions (none, or Gaussian sigma −40 dB relative to clean peak), two prefixes (0.5 and 2 seconds), and both rectangular and Hann windows. Sample rate is 2 kHz, recording duration four seconds, seed 1. Decays are 0.8/2.4/3 seconds for the separated signal and 2/0.8/3 for the nearby signals. This is a finite diagnostic set, not a calibrated general estimator benchmark.

## Findings

Representative relative-RMS errors, in percent:

| Signal | Noise | Prefix | Window | Candidate count | Observed error | Withheld noisy error | Withheld clean error |
|---|---|---:|---|---:|---:|---:|---:|
| Separated | none | 0.5 s | Hann | 3 | 0.015 | 0.115 | 0.115 |
| Separated | none | 0.5 s | Rectangular | 3 | 2.266 | 23.854 | 23.854 |
| Separated | −40 dB | 0.5 s | Hann | 3 | 2.811 | 7.972 | 5.275 |
| Separated | −40 dB | 2 s | Hann | 3 | 3.810 | 8.796 | 0.472 |
| Nearby, equal | none | 0.5 s | Hann | 2 | 11.624 | 68.859 | 68.859 |
| Nearby, equal | none | 2 s | Hann | 2 | 39.529 | 36.292 | 36.292 |
| Nearby, weak middle | none | 0.5 s | Hann | 2 | 1.851 | 23.927 | 23.927 |
| Nearby, weak middle | −40 dB | 0.5 s | Hann | 2 | 3.003 | 24.374 | 23.968 |

The clean separated half-second Hann estimates are approximately 139.99977, 190.00017 and 260.00003 Hz. Their continuation is close in this control. The rectangular estimates are approximately 139.96836, 190.01158 and 260.03009 Hz: small absolute frequency differences coexist with much larger later waveform error. This experiment holds those frequencies fixed; optimizing decays cannot correct their phase accumulation.

For the clean weak-middle half-second Hann case, the pipeline returns only approximately 199.99997 and 320.00032 Hz, with decays 1.102 and 3.027 seconds. Its observed error is small while the later prediction is substantially different. Calling a completed optimization a successful recovery would be misleading: the missing mode is never represented.

The two-second rectangular pass finds 5..8 candidates on the separated/equal-nearby controls and refuses those four observations. The remaining 20 observations produce local fits. No completed fit hits a decay bound in this set. These facts do not establish general convergence, mode completeness or physical identity.

Noisy and clean suffix metrics are separate; different prefix durations leave different validation intervals. The earlier 8 kHz listening study has a different noise realization in time and should not be treated as these exact trials.

## Reproduce and next step

```
node --test tests/estimated-joint-decay-study.test.js tests/joint-decay-study.test.js
node tools/study-estimated-joint-decay.mjs > estimated-joint-report.json
```

The complete CLI ran 24 observations. Five focused tests cover the estimated-prefix boundary and joint-fit controls. This adds two tests after the earlier three joint-fit tests; the last full-suite checkpoint of 699 predates both groups.

The next experiment should allow bounded frequency refinement while preserving its starting estimates and mode count, then compare genuinely withheld samples. That can test the fixed-frequency phase-error limitation. It cannot recover an omitted mode by itself; mode-count alternatives need their own explicit evidence and comparison. A future interface should preserve source listening, candidate lineage and refusals instead of reducing all this to a single confidence label. The product source page remains inspection/audition only.

### Follow-up: bounded frequency refinement

`tools/study-refined-modes.mjs` and `collab/notes/astra-refined-mode-study.md` now test the fixed-frequency limitation. Refinement greatly improves the clean separated control's continuation, but makes missing-mode controls' later predictions worse while improving their observed residuals. Initial candidates and mode count are retained. The next question is explicit model alternatives with withheld validation, not simply more optimization.
