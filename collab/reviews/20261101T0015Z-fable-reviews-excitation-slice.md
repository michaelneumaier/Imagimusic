# Review: M1 excitation slice (Astra, uncommitted working tree)

Reviewer: Fable. Date: 2026-11-01. Scope: `src/excitation.js`, `src/model.js`
(v2 patch, strike-weighted modes), `src/audio.js` (retire/damp lifecycle),
`src/scene.js`, `src/main.js` wiring. Ran full suite: 27/27 at review time.

## Verdict: approve-with-fixes

Fix 1 and label 2 before the physical tine ships; the rest whenever.

## Findings

### praise
- **The Animusic trick is in, and done right.** The sequencer schedules
  `APPROACH_SECONDS` ahead (`main.js:45-55`), `scene.js:57` draws voices before
  `voice.time`, and `strikerPose` lands contact exactly on the audio timestamp.
  Cause visibly precedes effect.
- **`releaseLevel` is shared by sound and picture** (`audio.js:5`,
  `scene.js:29,43`) and the test "releasing an almost-ended voice keeps audio
  and visual fade times equal" pins it. That is the shared-cause rule holding
  under a new mechanism.
- Silent modes keep their index in `voice.modes` for the layered drawing but
  allocate no oscillator (`audio.js:40-42`). Clean.
- Re-retire starts from the current fade level (`audio.js:21-24`) so a damper
  landing on a stolen voice doesn't jump. Good lifecycle thinking.

### should-fix
1. **Dead edges on the canvas.** `main.js:73` maps the touch to
   `clamp01((base - y) / length)`, so a touch at the top or bottom of a
   resonator yields position 0 or 1. The interpreted basis
   `sin((i+1)·π·x)` is zero there for every mode (`excitation.js:10`), so
   `modesFor` returns all-zero amplitudes and `audio.strike` returns `null`
   (`audio.js:35`): no sound, no voice, and therefore **no mallet** either.
   A silent tap with no feedback reads as a bug, not as physics. Clamp the UI
   position to about `[0.04, 0.96]` (keep the slider's full range if you like,
   but not the canvas hit test), or create the voice anyway so the mallet shows
   and the near-silence is visible as a near-node hit.
2. **Strike-position convention flips with geometry.** For the cantilever
   from `geometry.js`, `x01 = 0` is the clamp (dead for every mode) and
   `x01 = 1` is the free tip (maximal for every mode). For the sine basis both
   ends are dead and the middle is loud. When the physical tine (index 8) uses
   `shapes[n]`, the same slider means something different. Label it on the
   tine ("0 = clamp, 1 = tip") and consider drawing the clamp so the viewer can
   see which end is held. Not a bug; a legibility task that matters for the M1
   acceptance test ("can say why the strike point changed the timbre").
3. **Velocity enters twice, undocumented.** `excitationWeight` applies a
   velocity-dependent spectral tilt inside `modesFor` (`model.js:25`), then
   `audio.js:48` and `renderSamples` multiply by `velocity` again for level.
   That's a sensible split (hardness vs loudness) but a reader will think it's
   a double-count. One comment on `model.js:25` fixes it.

### nit
- Damping a scheduled, not-yet-sounding voice (`retire` with
  `voice.end < voice.time`): the gain ramp completes before the oscillator's
  start, `stop(end)` precedes `start(when)`, Web Audio treats it as never
  played, `onended` still fires so nodes disconnect. Visually the mallet
  approaches then vanishes before contact (`scene.js:57` filters on
  `end > time`). Acceptable ("the damper caught it"), but worth one test that
  pins `remaining → 0` for a stop-before-start voice so a refactor can't leak
  nodes.
- `audio.js:39` sets `voice.end` from `modes[0].decay` even when mode 0 is
  silent at the strike point; lifetime is then longer than the sound. Harmless.
- `strikerPose` hardcodes the 0.28 s recovery while approach is a parameter;
  with the 25 ms live approach, recovery is 11× the approach. Looks fine on
  screen, just asymmetric by design; a named constant would document it.
- `main.js:68` clears all dampers on window blur without per-index
  `damp(false)`; same effect today, but if `damp(false)` ever gains side
  effects this diverges.

## Geometry integration notes (for the index-8 tine)
- `modesOf(..., { sampleRate })` already applies the same 0.45 guard as
  `modesFor`; pass the context sample rate so the two voices agree.
- With steel η = 2e-4 and f₁ ≈ 326 Hz, τ₁ ≈ 4.9 s, so `DECAY_TAUS = 9` gives a
  44 s voice lifetime. Fine for the 48-voice cap at one tine, but the visual
  list will hold it a long time; consider `DECAY_TAUS` 6 for geometry voices
  or a lower η preset for the live tine.
- `toModelModes` amplitudes are explicitly stylized (see geometry.js header);
  the tine's caption should say "geometry-derived pitch and partials;
  stylized excitation."
