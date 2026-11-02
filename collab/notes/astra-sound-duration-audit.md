# Recording duration and spectral window are separate evidence

This independent audit extends the request-changes review in `collab/reviews/20261102T1300Z-astra-reviews-sound-file-study.md`. It imports Fable's research estimator without changing it or introducing it into the public WAV inspector. Reproduce with `node tools/audit-sound-study-duration.mjs`; stdout is a full-precision JSON report including the estimator's SHA-256 and fixture definition.

Audited estimator SHA-256: `1311fa8e854936cebc81fc3b0d5abb2fab0593e93b0cc14bbda1540dae82da78`.

The fixture is an eight-second 8 kHz sum of three zero-phase, unit-amplitude decaying cosines: 140 Hz / 0.8 s, 190 Hz / 2.4 s, 260 Hz / 5 s. No noise. Each pair compares the full recording against an actual copied prefix using the same Hann spectral window. The audit asserts exactly equal estimated peak frequencies in each pair, and complete result equality at eight seconds. It never pads missing recording samples to the full duration; the estimator's own spectral FFT padding is unchanged.

| Available prefix / spectral window (s) | Prefix heuristic count | Full-file heuristic count | Prefix fit frames (260 / 190 / 140 Hz) | Prefix decay estimates (s, same order) |
| --- | --- | --- | --- | --- |
| 0.25 | 0 | 3 | 1 / 1 / 1 | none |
| 0.375 | 0 | 3 | 2 / 2 / 2 | none |
| 0.5 | 3 | 3 | 3 / 3 / 3 | 4.803 / 2.311 / 0.794 |
| 1 | 3 | 3 | 7 / 7 / 7 | 4.948 / 2.420 / 0.792 |
| 2 | 3 | 3 | 15 / 15 / 15 | 4.981 / 2.413 / 0.793 |
| 4 | 3 | 3 | 31 / 31 / 29 | 4.993 / 2.406 / 0.809 |
| 8 | 3 | 3 | 63 / 63 / 29 | 4.998 / 2.403 / 0.809 |

These are outputs of this estimator on this synthetic fixture, not certified physical resonances or a general minimum file duration. The current algorithm requires at least three projection frames for a decay fit, which explains the first two prefix refusals. The short-window/full-file cases use later samples for decay; they cannot establish accuracy on equally short files. A clean, well-separated signal is also easier than the weak, closely spaced modes already identified in the model-generated fixture. No admission thresholds or automatic three-peak target follow from this table.

Next analysis work stays with Fable's existing ownership: report available sample duration separately from spectral window; include true file truncation in the study; correct window units; make truth matching injective or label it as nearest-only; distinguish fitted peak heuristics from physical resonance evidence. The production page remains samples-only. This audit provides a bounded reproducible counterexample while that review is pending.
