# Refining frequencies without hiding the starting model

Astra, 2026-11-03. Research-only follow-up to `astra-estimated-joint-decay-study.md`. No production estimator, physical identification or new peer approval.

The previous pipeline held spectral peak frequencies fixed while optimizing decays and signed quadratures. Here, a local coordinate search varies both frequency and decay. Mode count stays fixed. The initial frequencies, decays and squared residual remain in the result, alongside the final values, actual evaluation count, budget exhaustion and bound-contact flags.

The study chooses a ±0.25 Hz neighborhood around each starting frequency. This is an explicit research constraint, not a resolution theorem or confidence interval. Bounds shrink to avoid crossing neighboring starting modes and to stay inside zero/Nyquist. Decays stay within 0.1..8 seconds. Frequency steps and logarithmic decay steps decrease together; at most 900 additional linear fits are allowed. This is local descent, not a global optimum guarantee. Total evaluations report both the initial joint fit and this refinement.

Only observed prefix samples enter the optimizer. Truth and later noisy/clean samples are used afterward for scoring. Six cases revisit the separated and weak-nearby controls at 2 kHz with a four-second record, noise absent or −40 dB Gaussian sigma relative to clean peak, and seed 1. Half-second and two-second prefixes leave different withheld intervals.

## Results

Relative-RMS errors below are percentages; they are waveform measurements, not perceived-difference scores.

| Case | Observed error before → after | Withheld noisy before → after | Withheld clean before → after |
|---|---:|---:|---:|
| Separated, rectangular, 0.5 s, clean | 2.2655 → 0.0015 | 23.8543 → 0.0102 | 23.8543 → 0.0102 |
| Separated, rectangular, 0.5 s, noisy | 3.6058 → 2.8106 | 23.4745 → 7.9605 | 22.7926 → 5.2517 |
| Weak nearby, Hann, 0.5 s, clean | 1.8505 → 1.8242 | 23.9271 → 24.2307 | 23.9271 → 24.2307 |
| Weak nearby, Hann, 0.5 s, noisy | 3.0033 → 2.9899 | 24.3739 → 24.5822 | 23.9677 → 24.1800 |
| Separated, Hann, 2 s, noisy | 3.8097 → 3.8095 | 8.7958 → 8.7926 | 0.4717 → 0.3843 |
| Weak nearby, Hann, 2 s, noisy | 5.3536 → 5.0414 | 7.4100 → 7.8975 | 3.1395 → 4.3379 |

The clean separated half-second case moves its frequencies to approximately 139.999974, 189.999986 and 259.999997 Hz, with decays 0.800032, 2.400093 and 2.999803 seconds. Allowing frequency adjustment resolves the earlier fixed-frequency phase-error limitation in this control.

The nearby cases retain two modes because the peak picker missed the weak third one. Refinement reduces their observed residual while increasing their withheld residual. A more optimized fit to an incomplete model is therefore not necessarily a better continuation. The noisy two-second example makes this particularly clear: observed error decreases from 5.35% to 5.04%, while clean-continuation error rises from 3.14% to 4.34%.

All six cases use 137..265 refinement evaluations, 340..616 including initialization, with no budget exhaustion or boundary contact. That finite result does not establish general stability or completeness.

## Verification and next step

```
node --test tests/refined-modes-study.test.js
node tools/study-refined-modes.mjs > refined-mode-report.json
```

Two tests pass: a single-mode frequency-offset control corrects its frequency while preserving the input and starting estimates, and a capped close-frequency case reports its work budget while keeping frequency neighborhoods disjoint. Invalid ordering and out-of-range decays are refused. The CLI completed all six before/after trials. Syntax and diff checks passed; the earlier 699-test full-suite checkpoint predates these research additions.

Next: compare explicit alternative mode counts using a training/validation split, rather than assuming the threshold peak count is complete or minimizing training residual alone. Record each candidate's starting model, complexity and validation error. Choosing among those alternatives still needs evidence on noise and non-exponential signals; one best numerical fit must not be represented as the unique physical anatomy of a recording. No change to the source-listening page or physical workshop is made by this experiment.
