# Drawing a passage without smearing its strikes

Research prerequisite for `astra-next-encounter-milestone.md`. Run `node tools/audit-touch-history-sampling.mjs` for full-precision JSON, exact records and hashes of the model source files. No runtime or sound-model changes.

The study evaluates the first four seconds of seven admitted 8 kHz Touch records. For each, it compares linear interpolation of the existing model visual envelopes at 30, 60 and 120 samples/s against analytic values on 1000 and 2000 samples/s grids, also including exact event/Quiet boundaries. These are sampled references, not continuous extrema or error bounds. Neither is an audio waveform. The fast-beat fixture uses the model's existing averaged envelope mode and is identified as such in the report.

Three candidate drawings are measured: uniform samples; uniform samples plus exact event/ending points; and the same with separate samples immediately before and at each distinct strike. The last probes 1 ns before a strike and places that value on its left side, then uses the actual at-strike value on its right side. It is a numerical approximation to a one-sided limit, not an added sound event. Quiet boundaries use their exact recorded frame times; no gesture is moved or omitted.

A strike can change the quadrature-envelope magnitude discontinuously even though the new sine displacement begins at zero. Merely adding one at-strike point to a connected line can smear the increased envelope into the preceding interval. Splitting the boundary addresses that specific plotting artifact. It is not a correction to the physical model.

Maximum absolute interpolation errors over both bodies against the 2000 samples/s reference, for the 60 samples/s candidate:

| Fixture | Uniform points | Split strike boundaries | Change in split error from denser reference |
| --- | ---: | ---: | ---: |
| Single left | 0.0028301 | 0.0028301 | 0.0000120 |
| Delayed neighbour | 0.068422 | 0.00091837 | 0.000000856 |
| Simultaneous sides | 0.14899 | 0.0000025409 | 0.00000000335 |
| 128 dense admitted gestures | 0.0031528 | 0.0000045648 | 0 |
| Fast-beat averaged view | 0.058645 | 0.00000079960 | 0.000000000900 |
| Natural tail cutoff | 0.0010455 | 0.0010455 | 0.00000342 |
| Quiet during scheduled lead | 0.022546 | 0.00091837 | 0.000000856 |

Units are the existing model visual-envelope units, prior to scene width/glow mapping and without a new per-passage normalization. They are not calibrated acoustic pressure or perceived loudness. The final column compares sampled reference grids, not convergence proof. The Quiet case retains a scheduled gesture inside its recorded fade, matching the current replay semantics.

This establishes a useful implementation direction: plot separate sides of strikes and preserve exact timing markers; do not smooth across an impulse solely for visual continuity. It does not yet select a product sampling rate. The single-left and natural-tail cases retain interpolation error between events; sharper envelope minima can remain. Longest admitted passages, all settings and cross-connection fixed-scale comparison are not covered. Next is a bounded worker sampler and diagnostic, with explicit sample spacing and no automatic promotion to a product presentation. Peer review requested.
