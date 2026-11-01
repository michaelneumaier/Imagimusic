# Driven-study measurement plots

2026-11-01 · Astra · presentation tooling, actual Grove integration verified

`tools/plot-driven-study.py` accepts JSON `{title,duration,release,cases:[{label,trace:[{time,energy,bound}]}]}` and emits PNG/SVG using Matplotlib. `bound` means the state-derived output-amplitude ceiling, not the cumulative source-input budget. Traces must span zero to duration with finite increasing times and nonnegative energy/bound. The tool does not simulate the source or normalize traces. Cases share axes. Source-active shading and a release line name the driver interval; the caption says the lines connect sampled measurements and are not loudness or audio waveforms.

Development environment: Python 3.11 with Matplotlib 3.11.2 in `/tmp/imagimusic-plots`, outside production dependencies. Reproduce with a Python environment containing Matplotlib:

```
python tools/plot-driven-study.py trace.json figure.png
```

Visual QA used `renders/driven-plot-check/analytic.json`, an explicitly labeled analytic single-oscillator constant-force check, not Grove audition data. Rendered `analytic.png` and inspected it. Moved interval labels to segment centers after the first render overlapped the scientific-notation scale. The example is only a layout check; its sparse trace must not be used to infer the continuous oscillator frequency. Actual driven-Grove traces await Fable's corrected endpoint/time/source-budget contract. Peer review was requested via the plotting-contract handoff; no approval is claimed yet.


## Corrected Grove study integration

The complete corrected reports for Groves 3, 7 and 11 now supply the plot inputs through `tools/present-forced-study.mjs`. All three PNGs were rendered and visually inspected: shared case axes, readable legends and interval labels, exact two-second release marker, five-second endpoint, and separate energy/output-bound panels. These are sampled traces, not an acoustic waveform or listening verdict. Fable approved the tools in `collab/reviews/20261101T0903Z-fable-reviews-forced-study-tools.md` (2b2f9e6).

Local audition: http://127.0.0.1:8080/renders/forced-study/

Reproduce after rendering the three complete study reports:

```
node tools/present-forced-study.mjs renders/forced-study
python tools/plot-driven-study.py renders/forced-study/grove-3/plot-input.json renders/forced-study/grove-3/energy.png
node tools/verify-forced-study.mjs renders/forced-study/grove-3/report.json
```

Repeat the plot and audit commands for seeds 7 and 11. Matplotlib is needed only to generate figures. The page itself uses plain HTML and existing saved WAVs.

Safari at 320 × 656 verified explicit case playback, the active/released phase labels, Quiet pausing at the current position, and a Grove change clearing the prior player and phase without autoplay. These are transport checks; no claim of hearing the recordings is made. The first sentence now explicitly names the external force, addressing Fable's wording nit. Contacts remain throughout the five seconds; driver release is not a hand lift. Source budget, state-derived output bound and observed sample peaks remain distinct.
