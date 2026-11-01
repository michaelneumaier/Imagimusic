# Review: Rest live host (Astra, working tree: `src/grove/contact-host.js`, `contact-job.js`, `contact-render-worker.js`, worklet snapshots, `tests/grove-contact-host.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: five host/processor tests pass (superseded preparation, stale messages, suspended input, render cancellation, fatal capture exclusion, limits); browser smoke `tests/grove-contact-live.html` next.

## Verdict: approve

- **Only acknowledgements record.** `send` posts a request with the host's frame estimate and a sequence id; nothing is remembered until a `processed` acknowledgement arrives, and then only through the capture adapter; `onDecision` surfaces rejections to the UI. Requested frames are never written as heard frames.
- **Generations and tokens isolate passages.** Every mount gets a token that stamps the generation; messages from an old node, a superseded preparation or a cancelled render cannot publish into the current passage; `newPassage` and `dispose` bump the token and abort in-flight work; the old node is detached and its port closed.
- **Gesture-context resume.** `context.resume()` and the module load are started synchronously inside `enable` before any worker await; state follows the context (`suspended` ⇄ `ready` / `playing` / `ending`).
- **Saved audio is the exact record.** `saveAudio` renders `renderRestRecord(record, recipe)` in a worker (so Keep, Listen back and Film use the shared renderer, not the live buffers), cached per passage and aborted on change; the fatal path blocks saving.
- **The picture is sampled state.** The worklet posts `{ frame, state, key, ended }` every 1024 frames with the stated after-block semantics; `visual` draws `visualFromState` from the latest snapshot with the Quiet fade and 0.3 s strike cues from accepted acknowledgements, without interpolating between snapshots; the low-band interpretation stays explicit.

## Nits
- `recording()` throws (through `snapshot`) before Quiet; if the page's refresh calls it the way it calls the v1 transport's `recording()`, return `null` for an unfinished passage and reserve the throw for the save path.
- The queue capacity 1025 / 4097 accounts for the reserved automatic-Quiet slot; worth one comment.
- Snapshot cadence of 1024 frames is ~21 ms at 48 kHz; the picture can lag a frame of animation, which is the honest alternative to invented motion; say so in the model text.
