# Review: export.js and inspector.js (Astra, uncommitted)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/stage/export.js`,
`src/stage/inspector.js`, wiring in `src/stage/main.js`, vendored
`vendor/mediabunny` provenance. Decision 003 written for the dependency.

## Verdict: approve-with-fixes

Fix 1 (manifest consolidation) and fix 2 (audio repeatability, mine) before
calling the export milestone done. Cancellation and cleanup are sound.

## Cancellation and resource cleanup (what I checked)
- `check()` is called before the soundtrack, after it, and per frame; an
  abort throws `AbortError`, the catch sets `stopped`, cancels the output,
  awaits all tasks with `allSettled`, and `finally` disposes the world. The
  audio task cannot be interrupted mid `audio.add`, but it is awaited before
  rethrow, so nothing dangles. Good.
- The offline soundtrack (`renderPerformanceAudio`) cannot be aborted; an
  abort during it completes the render, then throws. Acceptable; say so in
  the progress text ("finishing soundtrack before cancelling").
- The export canvas is never attached to the DOM and the world is disposed;
  `BufferTarget` keeps the MP4 in memory (fine at 720p30 for a 34 s passage).
- Button states and `renderAbort` are reset in `main.js`'s `finally`.

## Camera and time determinism
- Frames are sampled at `FrameClock.times(duration)`, the picture is
  `project(collectState(t))` through `applyStage`, and video timestamps are
  `times[i]` with `1/fps` durations: fully determined by seed, patch, fps.
- Camera pose is copied from the live view into a fresh world and recorded in
  the manifest. One `controls.update()` after setting position/target: fine
  as long as damping and auto-rotate are off in the export world; please
  assert that in `createWorld(canvas, {width,height})` or skip `update()` and
  call `camera.lookAt(target)` directly, which has no state.
- Shell colour by material is set directly in `export.js:26` (and presumably
  in the live world). It is patch-driven and static, so not a determinism
  problem, but it is a visible property outside the bindings; the inspector
  cannot explain it. Nit: a `garden/slotN/shellL colour` binding with
  `inputs: ['material']` would close that gap.

## Findings

### should-fix
1. **Manifest consolidation.** `export.js:43` builds its own manifest
   (`stateHashes` of projected frames, camera, encoding). `src/stage/manifest.js`
   (`createTraceManifest(passage, { fps, project })`) produces the same hash
   list from the same inputs and is tested in node, which means a node test
   can regenerate the manifest for a seed and compare it against a file a
   browser exported. Use it as the base and spread the export-only fields on
   top (`width`, `height`, `camera`, `encoding`, `codecs` from feature
   detection). One hash list, one format, reproducible without a browser.
2. **Audio repeatability** (your Safari report: full passage differs by
   2.26e-5 run to run, choir-only identical). Mine to fix; diagnostics are
   in `tests/stage-render-browser.html` now (family isolation, compressor
   bypass, keepNodes on/off, max/RMS diff and position). Hypothesis: the
   engines disconnect ended nodes in `onended` callbacks, which land on the
   main thread at scheduler-dependent moments during offline rendering; a
   compressor whose inputs disappear may be processed differently from one
   fed zeros. `render-audio.js` now defaults to `keepNodes: true` offline.
   Until the matrix proves identity, the export says "deterministic scene,
   audio bitstream repeatability under investigation".
3. `renderPerformanceAudio(passage)` renders the whole passage even with a
   `durationLimit`; for the 3 s smoke export that is 34 s of audio synthesis.
   Pass a truncated passage (`duration: limit`) to the renderer.

### nit
- `inspector.js:36-39` re-implements voice-input resolution because
  `explainBinding` assumed `voices[...]` fields. Fixed on my side:
  `explainBinding` now resolves `voice.*` inputs from the target's
  family/slot for projected `stage.*` fields and lists several values when
  voices overlap, and reports `voices: [ids]`. You can drop the local
  lookup and print `detail.inputs` directly.
- Tine striker has no `bindingParam` tag, so clicking it explains
  `deflection`. Tag `world.tine.striker` with `reach` (or `position`).
- `format()` prints arrays >8 as "[n sampled deflections]": good. Consider
  showing min/max of the array too, it's the number a viewer wants.
- The inspector re-renders text every frame while a binding is selected;
  fine at 60 fps, but throttle to ~10 Hz if text layout ever shows in the
  frame-time distribution.
- The "light the route" highlight from proposal 004 (part → chamber →
  bellows → voice) is still to come; the data for it is `detail.voices` and
  `detail.inputs`.

### praise
- Two concurrent tasks (audio add, frame loop) with a yield every 8 frames
  keep the page responsive and the progress honest.
- Encoder feature detection up front with a clear error, no silent fallback.
- Vendoring with LICENSE and provenance (package, version, tarball,
  integrity) is exactly what decision 001 asked for.
