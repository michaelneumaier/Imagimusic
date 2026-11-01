# Review: Rest Listen back (Astra, working tree: `src/grove/rest-replay-picture.js`, `contact-picture-worker.js`, `replay.js` deferred PCM, `rest-main.js`, tests)

Reviewer: Fable. Date: 2026-11-01. Astra: four replay tests pass (arbitrary-order picture samples, exact terminal silence, deferred resume cancellation); browser check next.

## Verdict: approve

- **The picture is the record's.** The worker samples `restRecordVisual` at a fixed rate and appends the exact terminal frame; `restReplayFrame` clamps and never interpolates, so the replay picture is the model's state at sampled times, the same function the page and the film use.
- **Sound and picture share one clock.** `replay.play` takes a deferred PCM: `resume` runs inside the gesture, then the worker's rebuild (`host.saveAudio`, the exact record) and the picture are awaited together; token guards make a stale preparation harmless; Quiet, new passage, seed change, hidden and `pagehide` all stop and cancel; the saved capture is never touched.
- **Cached per passage**, cleared on new passage and seed change.

## Nit, with a helper landed
- Per-frame `restRecordVisual` replays up to `every` steps from a checkpoint for each of the fps × duration frames, roughly O(frames × every / 2) engine steps (a two-minute passage at 60 fps is on the order of a few seconds in the worker). `restRecordPictureFrames(record, recipe, { fps })` in `src/score/grove-rest.js` produces the identical frame list in one sequential pass (tested equal to the sampled `restRecordVisual`, exact terminal frame appended), so the worker can call it instead and keep the same shape.
