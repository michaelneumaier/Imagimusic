# Nearby modes: fit together, then predict beyond the observation

Astra, 2026-11-03. Research-only follow-up to the candidate reliability sweep. No production estimator, physical-body inference or peer approval.

## What is supplied and what is fitted

The frequencies are supplied explicitly. The model is a sum of `exp(-t/tau) * (a*cos(2*pi*f*t) + b*sin(2*pi*f*t))`. For each proposed set of decay constants, a twice-reorthogonalized modified Gram–Schmidt solve fits the signed cosine/sine coefficients. Nearly dependent columns are refused. The reported minimum independence ratio is a diagnostic of this column ordering, not a condition number or confidence score.

A bounded coordinate search varies decay constants on a logarithmic scale. Starts are 0.5, 2 and 5 seconds per mode; bounds are 0.1..8 seconds; there are at most 900 linear fits, with the actual count, bound contact and budget exhaustion reported. This local search does not guarantee a global optimum or identify the correct number of modes.

The source has 200, 201 and 320 Hz modes with decay constants 2, 0.8 and 3 seconds and amplitudes 1, 0.1 and 1. All phases are zero. The study uses 2 kHz samples, half-second and two-second observations, no noise or Gaussian noise with sigma −40 dB relative to the clean peak, and one deterministic seed. This is a different sampling setup from the preceding 8 kHz sweep; it is not a statistical comparison of estimators.

Each observation is fitted three ways: supplied true frequencies, a deliberately shifted middle frequency (201.1 Hz), or the middle mode omitted. After fitting, the model predicts through four seconds. Future error is evaluated only after the observed interval against the known **noiseless** continuation, which was not used to fit. That oracle is available in this synthetic experiment; arbitrary recordings would need actual withheld observations and a noise model.

## Results

Errors below are RMS residual divided by reference RMS, expressed as a percentage. Fit residual uses the observed source, including noise when present; future residual uses the noiseless continuation. These are not perceived-difference scores.

| Observed seconds | Noise | Supplied model | Fit error % | Future error % |
|---|---|---|---:|---:|
| 0.5 | none | true frequencies | 0.00237 | 0.0295 |
| 0.5 | none | middle shifted 0.1 Hz | 0.0565 | 4.003 |
| 0.5 | none | middle omitted | 1.850 | 23.927 |
| 0.5 | −40 dB | true frequencies | 2.3030 | 1.996 |
| 0.5 | −40 dB | middle shifted 0.1 Hz | 2.3002 | 2.769 |
| 0.5 | −40 dB | middle omitted | 3.002 | 23.918 |
| 2 | none | true frequencies | 0.00954 | 0.0395 |
| 2 | none | middle shifted 0.1 Hz | 0.939 | 0.874 |
| 2 | none | middle omitted | 4.267 | 2.409 |
| 2 | −40 dB | true frequencies | 2.981 | 0.164 |
| 2 | −40 dB | middle shifted 0.1 Hz | 3.120 | 0.891 |
| 2 | −40 dB | middle omitted | 5.230 | 2.492 |

The clean half-second fit with supplied true frequencies recovers decays 2.0000, 0.80090 and 3.00203 seconds. This supports testing joint fits further: the nearby weak mode need not contaminate every independently fitted decay when the mixture is explicitly represented.

But the noisy half-second fit with the deliberately wrong middle frequency has a slightly lower training residual than the true-frequency fit. It predicts the continuation less accurately. Omitting the weak mode can also leave a small short-window residual while substantially changing the later ring. Choosing a model solely by its fit on the observed prefix would miss these differences.

All 12 searches stayed within their budget and away from decay bounds (203..429 evaluations). Rebuilding the fitted waveform with a separate reconstruction function agreed with the solver's reported residual to within 3e-15 relative-RMS units. This checks implementation consistency, not physical validity.

## Reproduce and continue

```
node --test tests/joint-decay-study.test.js
node tools/study-joint-decay.mjs > joint-decay-report.json
```

Three tests pass: signed quadrature recovery and independent sample reconstruction, rank refusal and budget accounting, and optimized clean-mixture recovery with an unused continuation. The CLI ran all 12 cases successfully. The preceding 699-test full-suite checkpoint predates these three new tests.

Next: prepare source/reconstruction listening pairs at one shared level and compare predictions on genuinely withheld noisy observations. Frequency discovery, unknown mode count, attacks, changing pitch, pickup/radiation and room effects remain outside this experiment. The source page remains inspection and explicit audition only. No fitted mixture has been promoted to a declared physical-instrument target.
