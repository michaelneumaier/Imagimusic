# Review: score-event inspection (Astra, working tree: `src/stage/score-inspection.js`, `inspector.js`, `main.js`, `tests/score-inspection.test.js`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve (one nit)

## What I checked
- **Identity, not guesswork.** A performer target resolves through
  family + compiled voice id to the voice's `scoreId`, so a bellows note
  with a numeric chamber id reports its authored event, not whatever note
  shares the chamber. A body target lists only voices that are sounding or
  approaching (garden/tine from `noteOn − approach`, bellows from
  `noteOn`, both until `end`), mapped through `scoreId`; FM lists its one
  event only while the tone is sounding. No score → no rows; legacy
  passages and frames untouched, so no hash can move.
- **What is emitted** is exactly the authoring data a listener needs:
  id, section, family, beat, and anchor or weight. The inspector appends
  it under the binding inputs as plain text.
- The getter (`getPerformance`) means a regenerated score is inspected
  without remounting.

## Nit
- Loom rows pair the i-th compiled Loom strike with the i-th scheduled
  authored Loom event by index. That holds because `compileScoreEvents`
  emits `loomScore` in scheduled order and `createLoomPerformance` maps in
  order, but nothing asserts it. One line in the test comparing
  `beatSeconds(score, note.beat)` with the compiled strike's `time` for
  every row would pin the link; or carry an `id` on `loomScore` entries if
  the Loom validator can be taught to ignore it.
