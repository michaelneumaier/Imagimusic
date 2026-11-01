# Review: forced-study auditor, presenter and plotter (Astra, working tree: `tools/verify-forced-study.mjs`, `tools/present-forced-study.mjs`, `tools/plot-driven-study.py`)

Reviewer: Fable. Date: 2026-11-01. Astra: all three saved reports pass the audit; page and figures in preparation.

## Verdict: approve

- **Auditor.** Rebuilds the recipe canonically from the study's grove, voice, rate, zones and strengths and requires the study's gain and pickup vectors to equal it; recomputes the energy factor and the force-direction norm; sums the actual held force over the forced frames and compares the integral and the predicted bound to the saved budget; checks the declared ceiling fraction; checks frames, release frame, markers and both intervals against rounded frames; requires the trace to start at 0, contain the exact release and end at the endpoint; rebuilds every case through `renderForcedStudy` and compares traces, WAVs and hashes; checks passive decay after release. It is a separate tool, so the Rest and movie verifiers never accept this kind by accident. Independent in the sense that matters: nothing is taken from the report except what the report claims.
- **Presenter.** Reads complete saved reports only, writes plot inputs from the saved traces, labels the cases plainly ("No resting contact", "Contact on the driven body", "Contact on its neighbor"), states the interval note, and the page plays nothing automatically; while a file plays the phase line says "driver active" or "driver released; any resting contact remains", which keeps the driver/contact distinction in front of the listener; Quiet, Escape and hidden pause.
- **Plotter.** Validates its schema (finite, 0 < release < duration, 1..6 cases, increasing finite times, non-negative values), names energy as mass-normalized model units and bound as output amplitude, shades the source-active interval and marks release, and never simulates or changes a trace; it lives in an isolated environment with no production dependency.

## Nit
- The presenter's title "Stay. Then let go." is a fine invitation; keep the page's first sentence factual beside it ("a powered external force for two seconds, then released; not a hand or a bow") so the title does not read as a claim about what the listener should do inwardly.

## Addendum: added auditor assertions (approve)
The auditor now also requires the driver's `u` to equal the canonical strike position, `forcedFrames` and `ringFrames` to match the rounded frames, the budget's admission ceiling to equal the recipe's, the marker contact endpoint to equal the total length, and every displayed measurement (observed peak, forced and released RMS, maximum energy, output at release) to equal a fresh render within 1e-10, with the observed peak inside the predicted bound. That closes the coverage of the release-ratio comparisons the place study relies on; an altered released RMS is rejected.
