# Review: lab StateFrame migration (Astra, working tree)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/snapshots.js`,
`tests/snapshots.test.js`, `src/scene.js`, `src/bellows-scene.js`, diffs of
`src/main.js` and `src/bellows-ui.js`. Suite 91/91.

## Verdict: approve

Commit it. Slice A is complete once this is in and a Safari smoke confirms
the three canvases (garden, tine, choir) still move. Nits below are optional.

## What I checked

- **No engine objects in any canvas.** `drawGarden`, `drawTine`, and
  `drawBellows` take `{ frame, patch, ... }` and read `frame.voices`,
  `frame.global.dampers`, `voice.exciter`, `voice.modes[].energy`,
  `voice.modules.*`. The only engine reads left in `main.js` are
  `audio.dampers` (a Set of slot numbers, UI state, not a node) and
  `audio.time`. `tinePreview` mode shapes stay renderer-side as agreed.
- **Energy parity.** The old canvas computed
  `envelope × amplitude × velocity × releaseLevel`; `state.js` computes the
  same per mode and `drawGarden` sums `mode.energy × 3` with the same 1.6 cap.
  `tests/snapshots.test.js` asserts the garden energy at t = 1.1 equals the
  direct formula to 1e-12. Good.
- **Striker and damper.** Strikers come from `voice.exciter`
  (`visible/reach/contact/pos01`), which `collectState` derives from
  `strikerPose` with the voice's own `approach`; pre-onset voices exist from
  `noteOn − approach`, so the mallet still approaches before the sound.
  Dampers come from `frame.global.dampers.{garden,tine}` and show on idle
  slots. Tine damper checks slot 8. Correct.
- **Snapshot lifecycle.** `modalSnapshot` copies id, slot (`index`), noteOn
  (`time`), end, position, approach, fade fields, and the three mode numbers;
  no nodes, no shape functions (test proves it serializes and has no `nodes`
  or `shape`). `bellowsSnapshot` clones the voice's own bellows block
  (note-local settings survive a control change, test proves it), carries
  `stolenAt/stolenAmp/stolenEnv` so `state.js` uses the engine's frozen
  levels. `bellowsUI.snapshot()` prunes ended voices by `audio.time` before
  snapshotting; `main.js` prunes garden voices by `end > time`. Retired
  voices keep their updated `end` and `fadeAt`, so they fade in the picture
  exactly as in the sound.
- **Stateless drawing.** Sway, air specks, and tine wobble read `frame.t`.
  The idle chamber uses `voiceDynamics` on the current patch at `frame.t`.
  JSON round-trip of the frame before drawing in the test is the right
  oracle: a canvas can only depend on serializable state.
- `drawBellows` builds its per-slot state as `{ ...voice.modules, bellows: { fill01 } }`
  and reads `amp.level`, `filter.aperture01`, `lfo.value`, `env.stage`,
  `source.frequencyHz`, `lfo.rateHz`, `lfo.target`: all present in
  `VoiceState.modules` since c2ffbae. Air label uses
  `frequencyHz / noteHz`, consistent with the playbackRate adapter.

## Nits (optional)
- `bellowsSnapshot` hardcodes `stolenFade: .04`; import `STEAL_SECONDS`
  from `bellows-audio.js` so the two can't drift.
- `structuredClone(voice.patch.bellows)` runs per voice per frame (60 Hz × up
  to 6). The voice's patch is frozen at noteOn, so cache the clone on the
  voice once (`voice.bellowsSnapshot ??= structuredClone(...)`).
- `modalSnapshot` runs over every live garden voice per frame (≈36 at the
  default passage). Fine today; if it ever shows in frame times, snapshot on
  strike/retire events instead of per draw.
- `audio.dampers` could move to UI state so `main.js` reads nothing from
  the engine at all; purely cosmetic for the "no engine reads" claim.
- `snapshots.test.js` could add one stolen choir voice and assert the drawn
  level equals the frozen value × fade, closing the loop on the explicit
  `stolenAmp` path through the canvas.

## Praise
- The canvas proxy in the test that rejects any non-finite coordinate is a
  cheap, strong guard; keep it for the 3D bodies too (assert finite values
  reaching `setParam`).
- Moving the `fastLfo` decision to the note-local `modules.lfo.rateHz` means
  a chamber keeps the pendulum it started with. Exactly the point of
  note-local settings.
