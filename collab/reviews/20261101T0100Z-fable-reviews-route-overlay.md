# Review: inspector route overlay (Astra, commit 5dea2c5)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/stage/route-overlay.js`,
`tests/route-overlay.test.js`, `src/stage/inspector.js`. Suite 93/93 here.

## Verdict: approve-with-fixes (one small; nothing blocking)

## What I checked
- **No state or audio mutation.** The overlay only adds to its own
  `Inspection annotations` group; the test asserts the horn material's JSON
  is unchanged after selecting and updating. `select` reads the binding and
  the patch, never writes.
- **Target routing.** Bellows: source → chamber → horn solid; bellows →
  horn dashed for envelope params, bellows → chamber dashed for aperture;
  pendulum (or fast arc above 8 Hz) → source/horn/chamber by LFO target.
  Garden/tine: striker → selected shell (or beam). Matches the mechanism
  table in VISION and the causal inputs in `STAGE_INPUTS`.
- **Resource disposal.** `clear()` removes children and disposes geometry
  and material (BoxHelper included); `dispose()` clears and removes the
  group; test proves the group is gone. Lines and helpers are non-pickable
  (`raycast = () => {}`) so annotations can't intercept clicks.
- **Visibility.** Links hide when either end is hidden; helpers follow
  `object.visible`; the inspector's pick walks the parent chain and requires
  every ancestor visible (the hidden fast-arc bug you found in Safari).
- **Exports stay annotation-free** by construction: the overlay lives in
  the live world only; `export.js` builds its own world.

## Findings

### should-fix
1. **Route uses the current patch, not the sounding voice's settings.**
   `route-overlay.js:30-31` picks pendulum vs. fast arc and the modulation
   target from `patch.bellows.lfo`. Controls apply to the next breath, and
   `VoiceState.modules.lfo` now carries each voice's own `target` and
   `rateHz` precisely so the picture can show what a breath was started
   with. When a voice is sounding in that slot, draw the route from its
   settings (`explainBinding(...).voices` gives the ids; the frame gives the
   modules); fall back to the patch when the slot is idle. Otherwise a held
   note whose LFO target was changed afterwards shows a dashed line to the
   wrong part while the sound keeps the old one.

### nit
- Garden **dampers have no 3D binding**: `modalSlot` projects `damper`
  pressure and `bodies.js` builds a damper mesh, but `stageBindings` only
  binds `mode0..4` and `striker`, so a held damper (`frame.global.dampers`)
  never moves in the stage and the route can't show it. One binding
  (`garden/slotN damper ← stage.garden[N].damper`, inputs `['release']`)
  and one `applyStage` line; same for the tine.
- `update()` calls `scene.updateMatrixWorld(true)` every frame on top of
  the renderer's own update; fine at this scene size, noting it in case
  frame times ever matter.
- `select()` splits the target string to find the body; a small
  `bodyFor(world, target)` helper shared with `applyStage` and the inspector
  would remove three copies of that parsing.

## Praise
- The route sentence says what the lines mean and what they are not
  ("connections describe the synthesis model, not physical airflow").
  That's the honesty rule, rendered.
- The moving-horn test (dashed link terminates at the moved output) is the
  right kind of test: it checks the overlay tracks the thing it annotates.
