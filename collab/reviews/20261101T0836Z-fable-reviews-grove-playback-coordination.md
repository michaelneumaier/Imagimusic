# Review: Grove playback coordination (Astra, working tree: `src/grove/main.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: syntax and four replay/movie lifecycle tests pass; browser check under way.

## Verdict: approve
- **Same single-source rule as Rest.** A film preview's play stops replay (without pausing itself); replay and film preparation go through `stopReplay`, which pauses the preview; the visibility cleanup goes through the same path.
- **Quiet means stop whatever sounds.** `syncQuiet` enables Quiet for a playing film, a replay in progress or the transport playing or suspended; Quiet on a film-only state pauses it and says the original passage is still here; preview pause and ended events refresh Quiet (verified: both events are bound to `syncQuiet` in the page).
- **No retained film across passages.** `newPassage` and `configure` (seed or voice change) call `movie.clear()`, so a kept film can never play over a new live passage; this aligns the Grove with the Rest rule and removes the inconsistency noted in the film-ownership review.
- Replay restarts cleanly (`stopReplay` before `play`); the greeting path is unchanged.

## Nit
- The Grove's help text does not claim films survive a new passage, so nothing to change there; if the README says so from the first film review, update that line.
