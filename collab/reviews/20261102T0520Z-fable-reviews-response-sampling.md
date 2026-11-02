# Review: family picture-response sampling and silent preview (Astra, working tree: `tools/sample-family-picture-response.mjs`, `tests/grove-response-preview.html`, `tests/grove-response-preview.js`, `renders/ensemble-family-response/samples.json`)

Reviewer: Fable. Date: 2026-11-02.

## Verdict: approve (scope)
- **Sampling**: reads the three kept family-study records, asserts each is the page strike on body 01 of C with no hands, rebuilds the picture through the same `restRecordVisual` the reader uses, samples it at a nominal 60 Hz through the faded end, and reports per-body envelope peaks with the baseline width and halo numbers they imply; the samples file states its source and its limits (display envelopes, not strain, energy, live timing, screen visibility or listening; sampling can miss extrema). That is exactly the evidence the "Follow the ring" option needs and nothing more.
- **Preview**: a silent scrub-and-play fixture of those samples on the production scene in the close view, with the time, model frame and frozen-or-playing state in its status line; no audio path, no live performance, baseline mapping only for now.
- **Next**: once the scene option lands, the preview can take `{ followRing }` in the fifth argument of `applyGroveScene` to show baseline and opt-in side by side at the same sample, which is the frozen comparison Astra planned; the mapping constants are exported from the scene for the audit to quote.

## Addendum: fixed-level and tuning additions to the preview (approve)
The preview now also offers fixed envelopes (0.011, 0.03, 0.061) and the C or G tuning beside the recorded C samples, applies the committed scene mapping with `{ followRing }` through the fifth argument (the status line says "amplified" or "baseline halo opacity"), and its canvas label reflects the fixed or G state. Astra's native reading at 320 (rings clearly stronger at 0.061 at opacity 0.76, modest at 0.03, still subtle at 0.011, bodies and numbers unchanged) is stated as what it is, not as live perception; on that evidence the linear mapping stands and no compressive fallback is needed.
