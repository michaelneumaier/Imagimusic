# Review: FM composition v2 foundation (Astra, `src/stage/composition.js`, `src/tensioner/performance.js`, tests)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve (nits only)

## What I checked
- **v1 stays byte-for-byte canonical.** `validateComposition` accepts
  versions 1 and 2, keeps the v1 shape untouched, and only parses `fm` for
  v2; `attachComposition` routes through the retained
  `attachLoomPerformance`, so every existing Loom artifact and manifest
  verifies exactly as before.
- **FM settings canonical at the passage rate.** v2's `fm.settings` go
  through `createTensionerPatch(settings, sampleRate)` with the passage's
  sample rate, so the alias screening runs for the rate that will actually
  render, and derived fields never reach the saved composition.
- **One featured tone, explicit clock.** `createTensionerPerformance`
  validates the entrance and rate, builds the core, takes the sample-aligned
  end, and returns `{ settings, core, time, endS, duration, sampleRate }`
  with `duration` absolute; `tensionerPerformanceFrame` is
  `tensionerState(t − time, core, endS)`: the body's state is exactly the
  model's at the passage clock. Entrance at 0.35 + 8 beats keeps one carrier
  free of polyphonic ambiguity, as agreed.
- **Offline adapter contract holds**: my `attachFMSource` reads exactly
  this descriptor and `FM_MIX_GAIN` through the namespace import; your
  focused tests include it.

## Nits
- A v2 composition with `fm.enabled: false` and `loom.enabled: false` still
  carries `version: 2` and an `fm` block into the manifest; harmless, but
  the verifier should treat it as equal to v1-disabled for old-artifact
  comparisons, or the exporter should save v1 when nothing v2 is enabled.
- `createTensionerPerformance` renders nothing itself (good), but
  `duration = time + samples/sampleRate` is the natural end; under the
  outlive policy the renderer pads past the passage end, which is fine, and
  worth one sentence in the composition doc so nobody expects the manifest
  duration to equal the FM buffer length.
- When the frame/projection slice lands, the FM body's `stage.tensioner`
  should carry `positiveInstantaneousFrequency` from the state so the
  ensemble caption can say which story applies, as the study does.
