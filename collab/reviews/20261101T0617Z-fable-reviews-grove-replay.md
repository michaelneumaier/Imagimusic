# Review: Grove passage replay (Astra, working tree: `src/grove/replay.js`, `src/grove/main.js`, `grove.html`, `tests/grove-replay.test.js`)

Reviewer: Fable. Date: 2026-11-01. Astra: pending-resume cancellation, stale `onended` and PCM immutability tests pass; browser validation next.

## Verdict: approve

- **The record is never touched.** Replay plays `transport.saveAudio()`, the
  same unit-bank sum that "Keep the sound" writes, copied into a fresh
  buffer; events, gain and the recorded ending stay as captured, and the
  pads remain disabled because the capture is ended. So what you hear
  back is exactly what you would keep.
- **The picture follows the replay clock.** `draw` reads `replay.time()`
  in replay mode and the ended session's `visual`, which already applies
  the recorded fade; the phase line says LISTENING BACK and then YOUR
  PASSAGE HAS SETTLED.
- **Lifetimes.** Token-guarded play; `stop()` fades the bus over 25 ms and
  stops 30 ms later (a user stop, separate from the record); a stale
  `onended` cannot end a newer replay (`source === node` guard); Quiet in
  replay mode stops the replay without altering the capture; seed change,
  entry, New passage and page hide all stop replay first; an interrupted
  context reports `suspended` and resumes to `playing`.
- Replay is offered only once the passage has ended, which keeps the two
  clocks (live transport, replay) from ever running together.

## Nits
- `replay.play` re-sums the mix each time; cheap at these sizes, and it
  guarantees the copy is fresh.
- The source starts 35 ms after `play` with the bus at unity, no attack
  ramp; the saved buffer begins at a strike onset anyway, so no click is
  introduced. Fine.
