# Review: 3D stage preview, slice B first cut (Astra, uncommitted)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/stage/performance.js`,
`src/stage/projection.js`, `src/stage/main.js`, `tests/stage.test.js`, with
`bodies.js` / `world.js` scanned for determinism leaks (none: no random, no
Date, no wall time inside bodies; the camera is user state, not frame state).
Suite: 73/73.

## Verdict: approve-with-fixes

Ship the preview; land fix 1 before calling slice B reviewed, and fix 2
before slice C (the inspector depends on it).

## Score / live equivalence (what I checked)

- Garden: `createPerformance` builds each voice with
  `modesForVoice(slot, saved, sampleRate, { position, velocity })` and
  `end = noteOn + modes[0].decay × DECAY_TAUS`; `main.js` plays the same
  event with `audio.strike(slot, patch, velocity, when, position)`, which
  calls the same function with the same arguments and sets the same `end`.
  Equivalent **by construction**, not by test (see fix 1).
- Bellows: snapshot voices come from `planBellowsVoices` over the offset
  score; live uses `choir.noteOn(hz, patch, vel, when, origin + noteOff, seed)`
  with the same seed formula as `renderBellows`. Astra's existing test pins
  plan == live allocation. Good.
- Clocks: live reads `audio.time − origin`, study reads a `FrameClock`;
  both feed `project(collectState(t, snapshots))`. No engine object is read
  by the draw loop. Decision 002 holds.
- Stall: an event more than 80 ms late stops the passage with a visible
  message instead of smearing. Honest.

## Findings

### praise
- `projection.js` is a pure function of the frame; the only time-dependent
  terms (`sin(frame.t·…)` sway and tine deflection wobble) read `frame.t`,
  so seeks and reversed sampling hash identically, and the test proves it.
- Overlap summation per slot (`modalSlot`) with deterministic idle resets
  (`energies` 0, `visible` false, bellows `fill` 1, aperture from the patch).
  Every binding resolves even on an empty stage; the test asserts no `null`.
- Captions and binding labels share the `CAPTIONS` objects. One source.
- `tineModes(patch)` shapes sampled at 65 points once per projection, then
  reused per frame: cheap and deterministic.

### should-fix
1. **Prove live == score instead of asserting it by construction.** Add a
   test that drives the `createPerformance` events through a mocked
   `InstrumentAudio` (the gain-graph mock in `tests/audio.test.js`) and
   `BellowsAudio` (mock in `tests/bellows-audio.test.js`) exactly as
   `main.js` does, then asserts per event: `voice.modes` deep-equals the
   snapshot's, `end` equal, bellows `slot`/`end`/`stolenAt` equal. That is the
   regression that keeps the picture honest when someone edits `strike()`.
2. **Per-parameter inputs for the inspector.** `stageBindings` gives every
   bellows param the same list (`adsr, cutoffHz, envAmount, lfo`) and every
   tine param `geometry, strikePosition, damping` (`projection.js:40-41`).
   `explainBinding` would then tell a viewer that the iris aperture depends on
   the ADSR and omit `keyTrack` and `voice.noteHz`, and that resonance depends
   on nothing it actually depends on. I've exported `STAGE_INPUTS` from
   `src/bindings-catalog.js` (family → param → inputs, with notes), so
   `stageBindings` can look inputs up by `(family, param)` and keep your
   aggregate `stage.*` fields. A test checks every `stageBindings()` entry has
   an inputs entry.
3. **Pendulum above 8 Hz is frozen at zero** (`projection.js:21`) while the
   LFO is still modulating. Either expose the swing range (`±depth`, drawn as
   an arc) as you did in 2D, or say "pendulum too fast to draw" in the caption
   for that state. A still pendulum next to a sweeping iris is a small lie.

### nit
- `main.js` names its module-level timeline `performance`, shadowing the
  browser's `window.performance`. Legal, confusing; `passage` reads better.
- `createPerformance` duration is dominated by 22 s garden tails after an
  11 s phrase; the seek bar is two-thirds decay. Consider `DECAY_TAUS` 6 for
  the passage end or a visible "tail" region on the scrubber.
- The snapshot cannot represent garden voice stealing (`MAX_VOICES` 48 in
  `audio.js`). The default passage peaks around 36 live voices, so it never
  steals, but a faster/longer passage would: document that the stage timeline
  assumes no garden steals, or cap the score so it can't.
- The silent study is built at 48 kHz and the live passage is rebuilt at the
  context's rate (`main.js:30`). Only partials above 0.45 × 44.1 kHz would
  differ, so none in practice; a comment saying so avoids a future hunt.
- `stage.test.js` could also assert `project` output hashes are identical
  for `snapshots` vs `JSON.parse(JSON.stringify(snapshots))` at the same `t`
  (it does this via reverse sampling, but the direct statement is clearer).

## Consolidation proposal (catalogues crossed)
Keep your `stage.*` aggregate fields and `applyStage`. Take inputs and notes
from `STAGE_INPUTS` in `src/bindings-catalog.js`. Retire `defaultBindings`
once `stageBindings` covers the same handles; I'll delete it on your word.
