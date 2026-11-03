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

## Listening comparison and actual withheld noisy samples

`node tools/render-joint-decay-study.mjs --audio-dir renders/joint-decay-study` creates eight local listening tracks and a report: the full noisy source, its known clean synthetic reference, and each of the three supplied-frequency models fitted to 0.5 or 2 seconds. Every fit receives an actual prefix of the same four-second noisy recording. The remaining noisy samples are withheld from fitting, with the clean continuation reported separately as an oracle.

This listening version uses 8 kHz samples, not the earlier experiment's 2 kHz. It retains the same declared modes, noise level, seed and decay search. The actual noise samples and their relationship to time consequently differ; the slightly wrong model's lower training residual from the earlier run must not be carried over as a result here.

| Model and observed duration | Observed error % | Withheld noisy error % | Withheld clean error % |
|---|---:|---:|---:|
| Supplied true frequencies, 0.5 s | 2.2997 | 4.5847 | 0.8975 |
| Middle shifted 0.1 Hz, 0.5 s | 2.3001 | 5.5516 | 3.2865 |
| Middle omitted, 0.5 s | 2.9803 | 24.2388 | 23.8564 |
| Supplied true frequencies, 2 s | 3.0210 | 6.5816 | 0.1199 |
| Middle shifted 0.1 Hz, 2 s | 3.1602 | 6.6372 | 0.8952 |
| Middle omitted, 2 s | 5.2549 | 6.9624 | 2.3607 |

Different observed durations leave different suffix intervals; these normalized residuals should not be compared as though their reference windows were identical. Noise persists while the clean signal decays, so even a close signal reconstruction has a substantial noisy-suffix residual. These are sample metrics, not perceived-difference measurements.

All tracks are dual-mono PCM16, 32,000 frames, four seconds at 8 kHz, with one fixed 0.1 gain and the same final 200-frame linear fade. The fade applies only to listening WAVs; fitting and measurements use unfaded Float64 signals. There is no per-track normalization, truncation of the predicted continuation, or conversion to a Grove record. The page uses one explicit HTML audio player and pauses on departure. Each model names the observed duration and the duration it predicts. The clean source is labeled as a synthetic reference unavailable from an arbitrary recording.

Independent Python verification checked all eight WAV hashes, dimensions, identical left/right channels and final zero samples. It reconstructed all six fitted waveforms from the report's signed quadratures and decays, applying the declared gain/fade, with maximum decoded-PCM difference 0.0000214644 (less than one 16-bit sample step). The project preparer's read-only check reports this study ready and can regenerate it with its explicit audio-directory argument. The catalog and notebook link expose the study locally; generated audio remains untracked.

Native Safari check: the generated page opened with the player stopped and all eight choices visible. Explicit source selection entered playback; selecting the half-second omitted-mode reconstruction changed the single player to a four-second track at its beginning, and Pause stopped it. Catalog search for “glimpse” returned exactly 1 of 35 entries with an enabled local study link. These establish page selection/transport and discovery, not audible device output or a human assessment of the differences.

### Follow-up: frequencies from the recording

The next 24-observation study is recorded in `collab/notes/astra-estimated-joint-decay-study.md` and reproduced by `tools/study-estimated-joint-decay.mjs`. It removes the supplied-frequency advantage: all threshold-passing spectral candidates enter the joint fit without truth-guided selection. Clean separated modes can predict closely, but small frequency errors or an omitted nearby mode can materially change the continuation. Excess candidates are refused rather than trimmed; completed optimization is not certified recovery.
