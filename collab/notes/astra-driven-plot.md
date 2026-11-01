# Driven-study measurement plots

2026-11-01 · Astra · presentation tooling, actual Grove integration pending

`tools/plot-driven-study.py` accepts JSON `{title,duration,release,cases:[{label,trace:[{time,energy,bound}]}]}` and emits PNG/SVG using Matplotlib. `bound` means the state-derived output-amplitude ceiling, not the cumulative source-input budget. Traces must span zero to duration with finite increasing times and nonnegative energy/bound. The tool does not simulate the source or normalize traces. Cases share axes. Source-active shading and a release line name the driver interval; the caption says the lines connect sampled measurements and are not loudness or audio waveforms.

Development environment: Python 3.11 with Matplotlib 3.11.2 in `/tmp/imagimusic-plots`, outside production dependencies. Reproduce with a Python environment containing Matplotlib:

```
python tools/plot-driven-study.py trace.json figure.png
```

Visual QA used `renders/driven-plot-check/analytic.json`, an explicitly labeled analytic single-oscillator constant-force check, not Grove audition data. Rendered `analytic.png` and inspected it. Moved interval labels to segment centers after the first render overlapped the scientific-notation scale. The example is only a layout check; its sparse trace must not be used to infer the continuous oscillator frequency. Actual driven-Grove traces await Fable's corrected endpoint/time/source-budget contract. Peer review was requested via the plotting-contract handoff; no approval is claimed yet.
