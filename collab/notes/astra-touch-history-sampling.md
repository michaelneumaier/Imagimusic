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

## Bounded history foundation

`src/touch/history.js` now validates/rebuilds an existing Touch v1 record and prepares deterministic full-passage visual-envelope history at one of 30/60/120 Hz. It enforces the same eight-million-output-frame limit as the return page and a 20,000-point history limit before sampling. Uniform points are augmented with strike times, recorded Quiet endpoints and each unit's tail-fade corners. Distinct simultaneous strikes share one before/at sample pair but retain individual gesture metadata. The `before` probe remains explicitly 1 ns before its plotted boundary. A renderer must break the segment between before and at; it must not smooth through the jump.

Three tests pass: exact source independence and model-sample equality at both sides of a simultaneous strike, duration parity with actual return rendering; Quiet ending with an event inside its fade and another beyond output (all metadata kept, history ends at the output endpoint); and 128 admitted gestures spanning two minutes at 120 history samples/s, remaining within the point budget, with invalid rates and over-budget high-rate audio refused. The natural output end is represented explicitly, including its zero endpoint. The full-span test completed in about a quarter-second in this Node run, which is not a browser/device performance claim.

An isolated module worker wraps the builder. It has not yet been exercised in a browser or connected to a page. No runtime playback, production visualization, fixed-scale comparison or user-reading result is established by this foundation. Next: the inspectable diagnostic with explicit units, event boundaries and fixed scales, followed by real review.

## Silent browser diagnostic

`tests/touch-history-diagnostic.html` now runs the real history module worker through the existing transactional bounded file-reader session. It offers a generated delayed-neighbour File and local v1 file input, explicit cancellation, retained prior drawing until success, two static SVG traces with shared seconds axes and a manually chosen common ceiling (2, 1, 0.5 or 0.25), explicit clipped-sample markers/counts, gesture ticks and an exact accessible event list. Path segments break between before/at strike samples. No AudioContext, PCM rendering or playback is involved. It is not linked as a product feature.

Native Safari prepared the generated File through the real worker: 4.025 seconds, 245 points, two gestures, interfering-mode envelopes. Selecting the fixed 0.25 ceiling updated the control without changing the history. A screenshot exposed cramped spacing between the first axis labels and second heading; the vertical gap was increased, then reload/reprepare and a full plot screenshot confirmed separated labeled axes, left tick at zero and right tick at 0.713 s, and the visible break at that strike. The exact list showed frame 0/left/0.6 and frame 5704/right/0.5, with Quiet at frame 32000 and 200-frame fade. The existing three history tests pass after the text-input worker adapter; syntax and whitespace checks pass.

Evidence limits: the diagnostic's native file picker, cancellation, invalid replacement, clipping case, long history, narrow layout and cross-connection overlays are not yet checked here. No visitor reading test or peer review response has been received. The default ceiling of 2 makes typical envelopes small; an explicit smaller scale helps inspection without silently normalizing the traces. This is a diagnostic affordance, not a settled product treatment.

## Original and comparison on shared axes

`history-comparison.js` now prepares both histories independently through existing admission, preserving source/gestures and using the longer output duration for one shared time axis. It refuses identical/unknown targets and whole-passage headroom failures. The diagnostic prepares comparisons in a separate disposable worker, draws original solid and comparison dashed, and names changed settings, pickup scales, durations and each envelope mode. Source replacement cancels pending comparison work; a failed preparation retains the previous drawing. Each newly loaded valid source clears its old comparison. Target selection is staged and does not relabel an existing dashed trace.

Five combined history/comparison tests pass, covering source isolation, exact original history equality, unchanged non-settings fields/gestures, different natural tails sharing the longer duration, explicit pickup-scale difference, target refusal and existing full-span/Quiet checks. Native Safari prepared the delayed-neighbour example and Close kin through their real workers: detune 40 → 0, pickup scale 472.135 → 935.943, both durations 4.025 s. At an explicitly selected common 0.25 ceiling, a screenshot showed solid/dashed traces and broken strike boundaries on both strips, with six clipped body samples marked at the ceiling. A separate Node reconstruction counted the same six samples. This closes one native clipping case and the initial overlay check, not broader usability or all failure/lifecycle cases. Latest peer review remains pending; no product integration.
