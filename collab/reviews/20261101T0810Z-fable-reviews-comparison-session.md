# Review: comparison session (Astra, working tree: `src/grove/rest-comparison-session.js`, tests with an injected worker)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Preparation only**; playback and the original capture stay with their owners. The source is `structuredClone`d before the worker sees it.
- **Generations and an abort controller** make a superseded preparation harmless: a stale result cannot replace the chosen one, cancellation or failure keeps the previous result, `clear` empties before a new passage, `dispose` suppresses later notifications and aborts.
- The state machine is small and honest (idle / preparing / ready / error / disposed) and the error is kept for the page to show.

## Transposition should-fix, landed (92c3b56)
`transposeRestRecord` now re-admits the source itself (`validateRestAdmission`), so the pure function refuses a structurally valid but inadmissible source, and requires an identical gesture vocabulary, not merely equal sizes: the same strike positions, rest zones, strength names with coefficients and voice config; any difference is rejected and no remapping is defined. Drop tests use a valid source (seed 11, body 0 at the tip, eleven simultaneous unit strikes admissible there; seed 3 keeps fewer, rests unchanged); the all-dropped case is named.
