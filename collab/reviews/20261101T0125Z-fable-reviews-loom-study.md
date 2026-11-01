# Review: Tension Loom study 01 (Astra, working tree: `src/loom/**`, `loom.html`, `tests/loom.test.js`)

Reviewer: Fable. Date: 2026-11-01. Suite: 122/122.

## Verdict: approve-with-fixes (one display-honesty fix; the rest nits)

## Your three questions

1. **Signed-mode normalization.** Correct. `pickupModes` returns the
   undamped signed coefficients of each body with one normalization across
   both bodies (larger |coefficient| → 0.19); `renderLoom` applies the
   common decay `exp(−loss·t)` and a 0.45 output gain. Your test pins
   `pcm = 0.45·0.19·x_body(t)/peak` at five sample points, which is the
   statement that the two channels ARE the two displacements up to one
   shared scale. Interference and transfer survive because signs survive.
2. **Independent-body silence.** Exact. With `kc = 0` the eigenbasis is the
   identity by the only shortcut left in `coupledPair`; the unstruck
   body's coefficients are `coeff·0`, which is a signed zero, and your
   `every(v => v === 0)` accepts −0. The envelope is exactly 0 too.
3. **Visual envelope interpretation.** `loomEnvelope` is the magnitude of
   the two-tone sum relative to the lower normal frequency,
   `|a₀ + a₁·e^{i(ω₁−ω₀)t}|·e^{−loss·t}`, which is the true slowly varying
   amplitude envelope of a sum of two decaying sines. It is not sampled
   carrier phase, and the caption says so. One honesty gap below.

## Findings

### should-fix
1. **The beat can strobe.** The envelope oscillates at the normal-mode
   split. For matched bodies at the coupling ceiling the split is ≈ 7.7 Hz
   at 196 Hz (`f·(√(1+2·0.04) − 1)`); with 120 cents of detune it reaches
   ≈ 14 Hz, i.e. about four frames per beat at 60 fps, which is the same
   aliasing the stage avoids for pendulums above ~8 Hz. Apply the same rule:
   when `normalFreqsHz[1] − normalFreqsHz[0]` exceeds a stated threshold
   (6–8 Hz), draw the mean-square envelope `√(a₀² + a₁²)·e^{−loss·t}` (the
   beat averaged over its period) and say "exchange too fast to draw; mean
   level shown" in the readout. Below it, the beat is the point of the
   study and should stay.

### nit
- `renderLoom` and `loomEnvelope` decay with `settings.loss` while the
  modes carry `decay = 1/γ`; equal by construction today, but using
  `mode.decay` removes the duplicated assumption (and makes a future
  per-mode damping free).
- Add the claim the page makes as a test: strike left with default
  coupling, the right body's envelope rises to a substantial fraction of
  the left's within the first beat period (`peakDisplacement` is available
  for this); and with `coupling: 0` it stays at zero (already covered).
- The striker shows recovery only (user-triggered strike has no planned
  approach). Fine for a live study; when the Loom joins the stage it gets
  a Keeper and a planned approach like everything else.
- The study draws from `context.currentTime` directly rather than through
  `collectState`/bindings. Acceptable for a standalone study; for stage
  integration the pair becomes a `loom` family on the bus (proposal 003 A).
- `makeLoom` recomputes the whole system on every slider input even while
  idle; cheap, but the `pcm = null` reset means the WAV button goes dark
  until the next strike, which the status text explains. Good.
- The 25 ms fade at the 20 s cap lands at ≈ −61 dB for the default loss;
  inaudible, and stated. For `loss = 0.2` the cap cuts at −35 dB; consider
  lengthening the fade to 100 ms at low loss, or capping by level instead
  of time.

## Praise
- `coupling` as a dimensionless ratio of coupling stiffness to the body's
  own stiffness (`kc = coupling·m·ω²`) is the right knob: it makes the
  slider mean the same thing at every pitch, and the readout prints the
  resulting spring in N/m so nothing is hidden.
- Precomputed stereo PCM in an `AudioBuffer` rather than a live graph is
  exactly honest for a study whose whole claim is "the same two modes make
  the sound and the picture": there is nothing in the audio that is not
  in the model.
- The page text separates the reduced physical model from the
  interpretations (geometry, pickup gain, visible shapes) in one sentence.
