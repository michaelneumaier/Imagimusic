# Sound-study observation and matching corrections

Astra, 2026-11-03. Independent maintenance while Fable is unavailable; no peer approval claimed. Addresses the findings in `collab/reviews/20261102T1300Z-astra-reviews-sound-file-study.md`. Earlier results and the original duration audit note remain historical records of the previous method.

## Changed research contract

The spectral prefix now bounds decay fitting by default. `decayWindowSeconds` explicitly requests a separate decay prefix when needed; actual spectral duration, actual decay duration and total available duration are returned, including truncation to available samples. CLI rows print all three. `W` remains the actual spectral duration for compatibility.

Truth matching is one-to-one: maximize the number of assignments within the chosen main-lobe half-width, then minimize total absolute cents. A merged peak cannot recover two known modes. Each match includes its peak index. This is a known-answer study metric, not an inference of physical identity.

`candidateCount` names the threshold count; `supported` remains a compatibility alias. The thresholds are at least 20 dB above the spectral median and a negative-slope decay fit. Fit residual is reported but does not gate acceptance. Neither Hann nor rectangular candidates certify physical resonances. Window-width documentation now uses 1/W and 2/W Hz half-widths when W is seconds; the exclusion distance is a full lobe of the chosen window.

## Evidence

The duration audit uses a separated three-mode synthetic fixture at 8 kHz, with decay constants 0.8, 2.4 and 5 seconds. At all seven observation durations (0.25, 0.375, 0.5, 1, 2, 4, 8 seconds), default results are exactly equal whether given the actual prefix or the full eight-second recording. At 0.25 seconds there is one decay frame per peak, and at 0.375 there are two: both give zero threshold candidates. An explicitly requested eight-second decay window gives three candidates at both spectral durations. This demonstrates why the observation duration matters; it does not establish estimator accuracy on arbitrary recordings.

Regression coverage includes implicit prefix equivalence, explicit longer decay fitting and duration caps, invalid durations, duplicate-peak prevention, maximum-cardinality assignment where greedy matching fails, and minimum-cents assignment. Existing rendered-chain and synthetic controls remain covered alongside WAV parsing and waveform summary checks.

Validation: 14/14 focused tests passed. The seven-pair duration audit and complete nine-case study CLI both completed successfully. No full-suite or human listening claim is made for this research-only change.

Reproduce locally:

```
node --test tests/inverse-sound-study.test.js tests/inverse-sound-file.test.js tests/inverse-sound-summary.test.js
node tools/audit-sound-study-duration.mjs
node tools/study-sound-file-target.mjs
```

## Limits and next step

These changes repair study bookkeeping and observation boundaries. They do not add an estimator to the product. Window sidelobes, weak modes, beating, noisy decays and the global-median threshold remain research limitations. The next method study should assess false candidates and fit residuals across controlled noise, amplitude and spacing conditions before selecting any production acceptance rule. A recording still does not uniquely identify a physical body, excitation or pickup.
