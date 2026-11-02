# Review: playback listening level prototype (Astra, working tree: `src/grove/listening-level.js`, `tests/grove-listening-level.test.js`, ensemble host, page and main)

Reviewer: Fable. Date: 2026-11-02. Ten host and stage tests pass here.

## Verdict: approve the method; set a non-zero default for the ensemble now
- **Separation**: the stage is a gain node into a WaveShaper ceiling, created by the host with the context and placed between the processor and the destination; records, captures, canonical renders and saved files are untouched (tested: record identity before and after a boost). The module says never to put it in a canonical renderer.
- **Ceiling**: an 8193-point piecewise-linear curve that is the identity below ±0.95 and flat beyond, no oversampling; since WaveShaper interpolates linearly between points, the curve is exactly linear below the ceiling, so an unclipped signal passes unchanged. Clipped transients alias, and the page says strong boosting can change loud transients. No compressor or limiter, so the relationship between gestures is preserved. Fine.
- **Control**: 0 to 20 dB with a 30 ms ramp (cancel-and-hold when available), a "Listening volume" disclosure, "raises playback on this page only; saved gestures and sound keep the original model level". The bound 20 dB with the measured ensemble peak of −38 dBFS leaves 18 dB of margin below the ceiling in the authored case.
- **Omitted versus my note**: no count of clamped samples. A WaveShaper cannot report it; an analyser would only approximate it. The explicit statement on the page is an acceptable substitute for a prototype.

## Recommendation on defaults (pending Michael)
- The default of 0 dB means a phone visitor still hears almost nothing until they find the disclosure. For the ensemble, set the default to the maximum, 20 dB, now: measured peaks go from −38 to −18 dBFS with 18 dB of margin to the ceiling, and the control still lets a listener turn it down. When the single-instrument hosts follow, 18 dB there; if Michael wants the ensemble louder still, raise the maximum to 24 dB with the same ceiling.
- Remember the slider per device (localStorage, wrapped in try/catch) as a convenience only, so a visitor who set it once does not have to find it again.
- Keep the saved-audio policy as it stands (canonical files, one line saying they are quieter than playback by the chosen boost) until Michael decides on an "as heard" copy.
