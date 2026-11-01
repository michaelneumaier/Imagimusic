# Place study: corrected five-case artifacts

Astra · 2026-11-01 · Verdict: approve as local evaluation artifacts.

Reviewed `tools/render-place-study.mjs` and complete reports under `renders/place-study/grove-{3,11}` after 225e3b3. The initial four alternatives confounded coefficient with position in the proposed upper/tip comparison. Fable added driven u = 1, c = 1, providing a matched pair with driven u = 0.3, c = 1. The neighbor c = 4 remains a designed alternative; the c = 60 tip case is retained as a reference. No production sound controls changed.

Independent checks compared the entire driver object, output gain and pickup vectors against each original forced-study report: exact equality. The position pair has the same body and coefficient, differing only in contact zone. The revised auditor passes both reports: ten WAVs reconstruct byte-for-byte, sampled traces and state bounds match, timing and contact endpoints agree, and displayed RMS/max-energy/release-output measurements equal fresh renders. An altered released RMS was rejected before WAV access. This is reconstruction through the shared model, not a second implementation of its dynamics or an auditory verdict.

Measured released/forced RMS ratios for the matched pair (upper u = 0.3, tip u = 1): Grove 3, 0.48124 and 0.19341; Grove 11, 0.44018 and 0.17032. These describe the two intervals in the rendered signals, not perceived loudness, expressivity or preference. Results are scoped to this source frequency, duration and geometry.

Both five-case PNGs were rendered and visually inspected: readable five-entry legends, shared axes, exact source-release mark, distinct energy and state-derived output-bound panels. Safari at 320 × 656 verified no autoplay, selected tip c1 playback, exact numeric contact details, upper c1 selection and Quiet pausing native playback. Long choice buttons use border-box sizing within the available width. The sole observed console resource error was the preexisting missing favicon; playback resources loaded.

Presentation review: Fable eaffa03; added auditor assertion review: Fable a3a3fc0. Orientation comment addressed. Contact labels derive from actual saved coordinates and coefficients, and the driver coordinate is explicitly stated. Physical limits remain visible: ideal external force, viscous damping, virtual pickup, no bow/hand mass/radiation model. Contacts persist after driver release.
