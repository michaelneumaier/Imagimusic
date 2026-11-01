# Review: FM tensioner study page (Astra, working tree: `tensioner.html`, `src/tensioner/main.js`, `render-worker.js`, `render-job.js`, `src/audio-render-job.js`, scene)

Reviewer: Fable. Date: 2026-11-01. Core: `src/fm.js` at ef5b9b8, suite 160/160.

## Verdict: approve (nits only)

## What I checked
- **Sound from the model, nothing else.** The worker runs
  `renderTensioner(tensionerCore(validateTensioner(settings, sampleRate)))`
  and posts the Float32 PCM; the page plays it from an `AudioBuffer`. No
  native FM graph, so the sound and the picture share the equations by
  construction, as agreed.
- **Fade matches between sound and picture.** `endS` comes from
  `tensionerEnd(model, sampleRate)` with the same sample rate the worker
  renders at (recomputed at Play with the real context rate), and
  `tensionerState(t, model, endS)` drives the scene, so the carrier glow
  reaches zero exactly when the last sample does.
- **Lifecycle.** Any control change calls `quiet()` which cancels an
  in-flight job, fades the current source over 25 ms and stops it; Play
  during preparation cancels; the token is re-checked after the await;
  stale results are dropped; `onended` disconnects; hidden tab settles;
  Save is disabled until a fresh PCM exists. Same shape as the Loom page,
  now through one shared `createAudioRenderJob`, with the Loom wrapper
  keeping its public API and tests.
- **Validation at the edge.** If the real context rate makes the alias
  screening reject settings that 48 kHz accepted (possible at 44.1 kHz),
  Play's try/catch settles and shows the message; the controls stay
  honest rather than clamping.
- **Honesty.** The caption says digital linear FM illustrated as a control
  mechanism, rod as a visual connection, sound from the integrated
  frequency including signed phase velocity, halo as an estimate, wheel
  phase only below 8 Hz, no slowed vibration. Readout prints carrier,
  modulator, deviation and the estimated bandwidth.
- Presets cover the three reference voices (ratio 2 / 0.01 / 3.5) with the
  default carrier; the slow one is now within bounds.

## Nits
- Surface `state.positiveInstantaneousFrequency` in the readout
  ("carrier pitch stays positive" vs "digital FM beyond that range"); it is
  the one honesty flag the page does not yet show.
- `refresh()` validates with `context?.sampleRate ?? 48000` before a
  context exists; fine, but the status could say "assuming 48 kHz until
  audio starts" so a later rejection at 44.1 kHz is not a surprise.
- The seek bar's max is the sample-aligned end; a tiny label with the
  duration and the fade ("25 ms fade at 7.37 s") would make the finite
  end visible rather than implied.
- Link the page from the home index once Michael should find it; it is
  reachable only by URL today.

## Praise
- Extracting `createAudioRenderJob` and keeping the Loom wrapper's API and
  tests intact is exactly how to share code without a review storm.
