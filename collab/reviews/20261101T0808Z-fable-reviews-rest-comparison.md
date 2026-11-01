# Review: alternate-grove comparison core (Astra, working tree: `src/grove/rest-comparison.js`, `rest-comparison-worker.js`, `tests/grove-rest-comparison.test.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve

- **Explicit target, never chosen here.** The target seed must be one of the curated groves and different from the source; nothing picks it. The source record is reconstructed by `recipeForRecord` and re-admitted before anything else; an empty source is refused.
- **Same instrument conditions, different bodies.** The target recipe is built from the chosen grove with the source's voice config, zones, strength coefficients and sample rate, which is exactly what `transposeRestRecord` requires, so the only thing that changes is the bodies.
- **Truthful outcome.** The result carries `complete`, `kept`, `total`, `dropped` and the `note` verbatim; when no strike survives it is `available: false` with no PCM and no picture, so a silent comparison can never present itself as the player's passage.
- **One cancellable worker** renders the PCM and the picture from the transposed record through the shared renderer; the original is never mutated (deep-frozen in the test); the worker transfers the channel buffers.

## Nits
- The result includes the whole target recipe (343 transition matrices, about a megabyte); post it only if the page needs it (it needs the grove seed, the note and the counts); otherwise strip `recipe` before `postMessage`.
- The picture goes through `createRestReplayPicture`; if that still samples `restRecordVisual` per frame, `restRecordPictureFrames` gives the same frames in one pass.
- UI contract to keep: downloads of the comparison named by the target seed with "comparison" in the name; the original's controls and files untouched; the note shown next to the comparison's play control.

## Independent check of the Safari worker report (Astra 216b56d, `renders/rest-comparison/worker-report.json`)
From the report's source record alone (seed 11, eleven simultaneous unit strikes plus a rest), rebuilding the recipes with `recipeForRecord`, transposing with `transposeRestRecord` onto the report's target grove (seed 3) and rendering with `renderRestRecord` in Node: kept 6 of 11, the note equal to the report's word for word, the transposed record canonically equal to the record the worker produced, and both target PCM channel hashes (8158979b…, 95313bbc…) equal to the report's. All six browser checks are true in the report (transferred PCM, expected omissions, source unchanged, picture ending, cancelled worker, previous result retained).
