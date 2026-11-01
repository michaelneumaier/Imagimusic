# Review: cause intervals for the response trace (Astra, working tree: `src/grove/response-causes.js`, `response-cause-arcs.js`, trace and page integration, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: four cause tests and five trace tests pass; browser inspection of the actual marks next.

## Verdict: approve; with this the trace is a record of cause and response, and the prototype label can go once the browser check passes
- **Only accepted acknowledgements, after capture validation.** `createResponseCauses` consumes accepted acks with relative applied frames in order, opens and closes the held interval on start, switch, lift and Quiet, caps contact starts, and truncates the planned source at the actual Quiet; rejected commands do nothing; requested times never enter.
- **The playhead hides the future.** `at(time)` clips every band to the playhead, so during replay nothing from later in the record is shown before it happens; a held contact is drawn up to the playhead only.
- **Replay from the record's exact endpoints.** `responseCausesForRecord` replays the saved intervals with ends ordered before starts at the same frame (a same-frame switch tested), driven body only by explicit guard; so the replay arcs are the record's, not the screen's.
- **Geometry encodes nothing acoustic.** Fixed-width bands at separate radii (source outside the outer ring, the two hand zones inside the inner ring; the response rings only ever deviate outward, so nothing overlaps), colours keyed, no amplitude in width or radius; ticks at 0, 2 and 5 s.
- **One time origin.** Checked: the response lines, the cause arcs and the ticks all use the same angle origin (−π/4 + 2π·t/5.025), so a dip in the driven body's line sits exactly under its hand arc.
- Lifecycle: new passage, seed and replay clear; a completed capture refreshes the exact intervals; replay consumes every sequential frame.

## Nit
- The hand bands at 2.12 and 2.28 are close; keep the legend naming them by zone (upper, tip) beside the colour so the two are never read as one band.
