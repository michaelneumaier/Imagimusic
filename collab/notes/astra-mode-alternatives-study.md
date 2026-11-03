# Choosing among explicit mode hypotheses

Astra, 2026-11-03. Exploratory research, not a production model-selection contract or physical-anatomy claim. Fable is unavailable; no peer review is asserted.

## What is held apart

The four-second source is divided into three intervals: 0..0.5 seconds for fitting, 0.5..2 seconds for choosing among fitted alternatives, and 2..4 seconds for evaluating that already chosen model. No candidate is refitted on validation data. The choice is frozen before any final-interval reconstruction or scoring.

This is a within-run separation, not an untouched external benchmark: related synthetic fixtures informed earlier development. Results from repeated experiments must not be presented as a blind estimate of generalization to arbitrary recordings.

The initial threshold peaks define one candidate. Alternatives add exactly one frequency at offsets ±0.25/T, ±0.5/T or ±1/T around each initial frequency, where T is the half-second training duration. At most four modes are admitted, and duplicate or near-identical starting frequencies are excluded. The grid is declared before inspecting validation errors; it is a finite set of guesses, not a complete enumeration of possible modes. Each candidate fits its own decays and quadratures, then refines frequencies within non-crossing ±0.5 Hz neighborhoods. The existing per-fit budgets are retained and counted.

The selection rule is deliberately simple: smallest relative-RMS residual on the noisy validation interval, exact ties preferring fewer modes and then lexical ID. There is no calibrated complexity penalty or confidence threshold. This tests whether raw validation can distinguish useful additions from extra parameters fitting noise; it does not assume the rule is suitable for a product.

Controls use 2 kHz, Gaussian noise sigma −40 dB relative to clean peak, and strong modes at 200 and 320 Hz with decays 2 and 3 seconds. Two recordings add a weak amplitude-0.1 mode with decay 0.8 seconds, at 201 Hz/seed 1 or 200.7 Hz/seed 2. Two controls omit that mode entirely, using seeds 1 and 2. The off-grid 0.7 Hz case avoids relying only on a missing mode placed exactly at one declared extra-frequency offset.

## Boundary checks

Three focused tests pass: hypothesis generation preserves the original and adds at most one explicit mode; selection uses validation error with the stated tie rules; and replacing every sample after two seconds with 99 leaves all fitted candidates, training/validation metrics and the selected ID exactly unchanged while changing the final-interval metric. The last check exercises actual synthesis, spectral estimation, fitting, refinement and selection rather than mocked scores alone.

Reproduce:

```
node --test tests/mode-alternatives-study.test.js
node tools/study-mode-alternatives.mjs > mode-alternatives-report.json
```

## Observed results

All four recordings generated and fitted 13 alternatives: the original two-mode estimate and twelve explicit three-mode guesses. Across the 52 alternatives there were 71,957 initial-fit plus refinement evaluations. Every selected model had three modes.

Errors are relative-RMS percentages against the noisy interval. “Initial” below means the refined original two-mode hypothesis; “selected” is the validation winner. The final interval played no role in this choice.

| Recording | Initial validation | Selected validation | Initial final interval | Selected final interval |
|---|---:|---:|---:|---:|
| Weak mode at 201 Hz, seed 1 | 19.989 | 6.520 | 34.329 | 12.224 |
| Weak mode at 200.7 Hz, seed 2 | 17.185 | 8.087 | 30.836 | 14.041 |
| Two true modes, seed 1 | 3.241 | 3.234 | 6.409 | 6.376 |
| Two true modes, seed 2 | 3.321 | 3.295 | 6.532 | 6.436 |

The additional hypothesis materially improves the two missing-mode examples. However, both actual two-mode recordings also select an extra mode for small residual reductions. Even a reduction on the final interval is not proof of true mode count in this finite noisy example.

The weak-mode winners are not clean recoveries. The 201 Hz example selects approximately 200.00064, 201.23574 and 319.99975 Hz with decays 1.71165, 0.97874 and 2.96417 seconds. The 200.7 Hz example selects approximately 200.00465, 200.68743 and 319.99943 Hz, but the added mode's decay is about 7.05 seconds rather than the true 0.8 seconds. It also touches its frequency bound. Both winners exhaust their 900-evaluation refinement budgets.

The winners on the two-mode controls exhaust their 900-evaluation initialization budgets; their refinements use 865 evaluations each. One puts the extra mode's decay at the eight-second upper bound. Initialization and refinement budgets are exposed separately by the tool, in addition to total evaluations and final bound-contact flags. None of these results should be labeled converged or certified merely because it ranks first.

## What this changes

Raw minimum validation error is insufficient as a mode-count decision. Exact-tie preference for fewer modes almost never helps when extra parameters improve a score by a tiny amount. A meaningful improvement criterion needs calibration against noise and model mismatch, not a threshold tuned to these four examples. Repeated starts, bound sensitivity and convergence also need separate reporting; silently extending budgets until a preferred answer appears would not establish correctness.

For the creative experience, alternatives can remain useful as explicitly proposed interpretations that a person can compare and play. Their lineage, source reference, complexity and limitations should remain visible. This study does not turn a recording into a unique anatomy or authorize automatic three-resonance/common-decay handoff. Further research should include unmodeled attacks and pitch motion, additional seeds and independently chosen signals before any acceptance rule is selected.

Validation: all 52 fits completed; the complete study CLI finished successfully. Three focused tests passed after adding separate initialization-budget metadata and accounting checks. Syntax/diff checks passed. The earlier full-suite checkpoint predates these research additions. No human listening or device-output claim is made for this numerical experiment.
