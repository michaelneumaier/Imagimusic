# Review: scored Loom passage (Astra, `src/loom/performance.js`, `tests/loom-performance.test.js`)

Reviewer: Fable. Date: 2026-11-01. Suite: 129/129.

## Verdict: approve (nits only)

## Math and normalization (what I checked)
- **Coherent superposition.** `loomPerformanceFrame` sums, over every
  sounding strike and both normal modes, `velocity·amp·e^{−age/decay}·sin(2π f·age)`
  with each strike's own onset. That is the linear system's response to
  the sequence of impulses, identical to `superposeStrikes` in
  `coupling.js`; your third test uses my `response.x(t − t₀)` as the oracle
  and matches to 1e-12 under 100 cents of detune. Nothing resets, nothing
  is re-tuned mid-passage.
- **Envelope with phase.** The quadrature accumulates `amp·e^{i(2π f·age − 2π f₀·t)}`
  across strikes and modes, so the beat between strikes landing at
  different phases is real, not a sum of magnitudes. Non-averaged:
  `x = Im(e^{i2πf₀t}·Σ) ⇒ |x| ≤ |Σ|`, which your test asserts. Averaged
  (fast exchange): `√(Σ_j |q_j|²)` keeps coherence across strikes within a
  mode and averages across modes, the right "mean level".
- **One pickup scale.** `pickupPeak` is taken over the raw coefficients of
  both strike directions and both bodies, so a right-hand strike at equal
  velocity is an equal impulse even when detuning makes one direction's
  raw response larger. Correct, and exactly the thing a per-strike
  normalization would have hidden.
- **Output bound.** `audioGain = 0.45 / max(1, Σ_e v_e·Σ_modes |amp|)` is a
  true upper bound on the peak of the summed signal (triangle inequality),
  so the passage never exceeds 0.45 with no compression. Conservative by
  construction; the eight-strike default lands quieter than a single
  strike, which is the honest price. Stated in the file.
- **PCM equals picture.** `renderLoomPerformance` sums the same terms in
  event order with sub-sample onsets (`age = i/sr − t`), and the first
  test pins `channel[i] == audioGain·displacement(i/sr)` to 2e-8 at
  fractional onsets and overlaps. Deterministic (fixed summation order in
  JS, no engine involved).

## API
`createLoomPerformance(settings, score) → { settings, studies, events,
duration, pickupScale, audioGain }`, `loomPerformanceFrame(passage, t) →
{ time, displacement, envelope, averaged, strikes[] }`,
`renderLoomPerformance(passage, sampleRate)`. Clean; the frame already
carries what the bus needs (per-body displacement/envelope as the `loom`
family's body state, and `strikes` with age ±0.18/0.28 as exciter states
for Keepers). When it joins the stage, each strike becomes a VoiceState
and the two bodies a `global.loom` fragment; no API change needed.

## Nits
- In averaged mode `|x| ≤ envelope` is not guaranteed (the mean-square of
  the modes can be below the instantaneous sum). Your test only exercises
  the non-averaged branch; either guard the assertion with `!averaged` or
  say in the caption that the mean level is a level, not a bound.
- `renderLoomPerformance` for the eight-strike default is ≈ 30 M sine
  evaluations on the main thread (≈ 0.5–1 s). Fine for a study; a Worker
  (like the garden's WAV path) keeps "Play conversation" responsive.
- `loomPerformanceFrame` re-derives the superposition that
  `superposeStrikes` provides; equivalent and tested against it, so keep it
  if you prefer the quadrature in one place, or call `superposeStrikes`
  for `displacement` and keep only the envelope here.
- `strikes[].age` is exposed with floating noise (`-0.14999999999999997`
  in the test); harmless, but a consumer comparing to `−0.18` exactly will
  be surprised. Not worth rounding; worth knowing.
- The sorted `events` discard the caller's order silently; fine, but
  `id` is assigned before sorting, so ids follow input order while
  playback follows time. Say so or assign ids after sorting.

## Praise
- Using the raw-coefficient peak across both directions is the kind of
  normalization decision that is easy to get wrong and silently so; the
  detuning test makes it impossible to regress.
- The envelope keeps phase across strikes. That is what makes "the second
  strike landed on the backswing" visible, which is the whole conversation.
