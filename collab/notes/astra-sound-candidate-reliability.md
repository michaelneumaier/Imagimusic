# When a clean fit is misleading

Astra, 2026-11-03. Research toward a sound becoming a playable instrument. Fable is unavailable; this is independently measured evidence, not peer approval or a production estimator contract.

The corrected observation and matching contract is documented in `astra-sound-study-review-fixes.md`. This next study asks whether its candidate thresholds and decay residual could support an automatic interpretation of a recording.

## Controlled sweep

Run `node tools/study-sound-candidates.mjs > report.json`. The report includes the estimator SHA-256, complete protocol and every observation. This run used estimator SHA-256 `7f40b032337e0894fe2f843b847405227b871209645a2197e19fd12f27b7a62f`.

486 three-mode observations cover:

- 200 Hz, a second mode at 201, 204 or 240 Hz, and 320 Hz, with respective decay constants 2, 0.8 and 3 seconds.
- The second mode at 0, −20 or −40 dB amplitude relative to the other two.
- No noise, or Gaussian noise with sigma at −40 or −20 dB relative to the clean signal peak. These labels are not RMS signal-to-noise ratios.
- Three deterministic seeds paired with three phase configurations; this small set is not a statistical population.
- Rectangular and Hann spectra over 0.5, 2 and 4 seconds, sampled at 8 kHz. Decay uses the same prefix as the spectrum.

A further 36 observations cover exact silence and noise alone. Noise is generated with a known carrier and then that carrier is subtracted, because the existing synthesizer scales its noise by the clean signal peak and empty modes would produce silence.

Only peaks passing the existing 20 dB/negative-decay-slope thresholds enter the one-to-one truth assignment. Each table row contains 81 observations and 243 known modes. Assignment permits the chosen window's main-lobe half-width. Frequency within 5 cents and decay within 20% are descriptive study tolerances, not perceptual or production acceptance rules.

| Window | Seconds | Candidates | Matched | Missed modes | Unmatched candidates | Decays within 20% |
|---|---:|---:|---:|---:|---:|---:|
| Rectangular | 0.5 | 444 | 183 | 60 | 261 | 166 |
| Rectangular | 2 | 491 | 200 | 43 | 291 | 182 |
| Rectangular | 4 | 524 | 205 | 38 | 319 | 186 |
| Hann | 0.5 | 177 | 177 | 66 | 0 | 159 |
| Hann | 2 | 194 | 194 | 49 | 0 | 187 |
| Hann | 4 | 180 | 180 | 63 | 0 | 180 |

All assigned frequencies were within 5 cents. Silence and noise controls yielded zero threshold candidates. Hann's zero unmatched candidates applies only to this finite sweep; it is not a general false-positive guarantee. Longer observation did not monotonically increase its recovery: the four-second Hann pass missed more known modes than the two-second pass.

## The counterexample that changes the next step

At 200, 201 and 320 Hz, with the middle mode at −20 dB, zero phases, no noise and a half-second Hann observation, the 200 Hz candidate has:

- Frequency error: −0.000969 cents.
- Decay error: −45.968% against the known two-second decay.
- Decay fit residual: 0.005003 dB.

Its frequency and straight-line fit look excellent while its decay estimate is substantially wrong. A regression preserves this counterexample. It is consistent with a short projection observing a mixture of nearby modes rather than an isolated exponential; the measurements do not by themselves identify all causes of failure.

A rectangular example also produces an unmatched candidate at 246.993 Hz with a residual of only 0.0000791 dB (40 Hz spacing, −40 dB middle mode, no noise, third phase configuration, half-second prefix). Low residual therefore cannot independently certify even the candidate's identity.

## Implication for the experience

A useful interface should let a person inspect and audition a proposed interpretation while keeping the original sound accessible. It should preserve uncertainty about missing or merged modes and avoid silently assigning one common decay. The next analysis experiment should compare estimates across observation prefixes and probe mixtures directly, rather than promote a residual cutoff from this sweep. Such comparisons can reveal instability; agreement alone would still not certify an instrument.

Validation: all six focused candidate-metric and original sound-study tests passed; the complete 522-observation run finished successfully. The project home links this note and the preceding correction note.

No sound-analysis product behavior changed. These synthetic signals omit attacks, microphone placement, rooms, nonlinear contacts and changing pitch. Turning a spectral description into a physical body remains a separate constrained design problem with multiple possible answers.
