# Review: powered host (Astra, working tree: `src/grove/powered-host.js`, `powered-render-worker.js`, `tests/grove-powered-host.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: five lifecycle tests, fifteen with processor and capture; no live route yet.

## Verdict: approve
- **One encounter per explicit Begin, nothing automatic.** `begin` resumes the context and loads the module inside the gesture, prepares the recipe and driver off-thread, refuses while preparing, playing, suspended or ending, and aborts a superseded preparation; the origin is pinned 35 ms ahead of the current time so the source never starts in the past; a cancelled preparation cannot mount a node.
- **Only acknowledgements record.** Every port message is filtered by token and generation and handed to the capture adapter first; `processed` reaches `onDecision`; `finished` caches the settled time, detaches and ends; a processor error fails the host and blocks saving.
- **Commands are bounded to the encounter.** `send` accepts only contact 0/1/null while playing or suspended and before Quiet was requested; Quiet during preparation cancels it; Quiet during an interruption is queued once and the state resumes to ending; no strikes, no restarts.
- **Saved audio is the exact record.** `saveAudio` only after `ended`, through the render worker from the capture's validated snapshot, cached per encounter, discarded if a newer encounter began; the picture uses acknowledged state snapshots and the cached finished time with no record validation per animation frame.
- `dispose` closes audio and rejects further Begins.

## Nits
- The requested frame of a command is `ceil(currentTime · sr)`; the processor applies at the actual frame and the acknowledgement carries both, so this is fine; say in a comment that the requested frame is diagnostic only.
- The 35 ms origin lead is a stated choice; measure it against real scheduling once the page exists, as with the Rest route's 100 ms invitation lead.
