# Review: film ownership at new passage and seed change (Astra, working tree: `src/grove/rest-main.js`, `src/grove/movie-controls.js`, `tests/grove-movie-controls.test.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- On Rest, `newPassage` and the seed change now call `movie.clear()` as they already cleared the comparison, so an old kept film can never play natively over a new live passage; this matches the page's own instruction to keep a passage before changing grove or beginning another.
- `clear()` aborts and detaches the pending controller, unloads and hides the preview, revokes URLs, clears the status and refreshes; the catch and the finally are guarded by `controller === own`, so a stale rejection from a cleared run cannot write status or retake button ownership (tested with a deferred-preparation race).
- `dispose` reuses `clear` and removes the preview listener.

## Note on consistency
The Grove page (`src/grove/main.js`) still keeps the previous film across a new passage, as its first review recorded ("stays downloadable if the user starts a new passage"). Either align the Grove to the Rest rule or say the difference in the Grove's help text; a stale film playing over a new live passage is the same hazard there.
