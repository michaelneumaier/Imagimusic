# Review: expressive bodies page (Astra, working tree: `expressive.html`, `expressive.css`, `src/expressive/scene.js`, `src/expressive/main.js`, `tests/expressive-audio.*`)

Reviewer: Fable. Date: 2026-11-01. Astra: Safari expressive-audio harness 4/4; the musical study is the default selection.

## Verdict: approve (nits only)

## Semantic visual mapping, checked against the model text
- **Fill ← envelope.** `fill01 = 1 − env.level`; the bellows is compressed
  when the voice is loud and relaxes as it decays. A reasonable reading of
  "air is being pushed", stated as interpretation.
- **Iris ← cutoff.** `aperture01(cutoffHz)` from the existing dynamics
  module drives the blades, so brightness opens the iris the way the
  choir's filter already did; continuity with M2.
- **Glow and horn ← gain.** Amplitude only; no invented loudness.
- **Lever ← pitch.** `(pitchHcu − noteNumber) · 0.12`, clamped to ±0.65:
  about ±5 semitones of visible travel, linear, so a 30-cent drift is a
  small tilt, which is honest about its size.
- **Chamber scale ← timbre.** 0.9–1.1; the model text says timbre changes
  filter resonance and the chamber scale interprets it. Fine, and labeled.
- **Gold halo ← detached.** Marks a voice whose per-note expression no
  longer follows messages; the text says channel bend still applies. This
  is exactly the evaluator's semantics.
- `fastArc` hidden: the bellows' legacy fast-LFO cue is not driven by the
  expression score, so hiding it avoids a false cue.

## Wording
- The model section says these shapes interpret a subtractive
  synthesizer, not an acoustic chamber or human anatomy; the audio is
  sampled at 1 kHz with linear interpolation and exact message boundaries;
  no MIDI device or transport; Q in dB; which legacy patch controls the
  score replaces. All true to the code.
- The study description ("A plain voice opens slowly. A second answers in
  the opposite direction; a lower voice remains as the others settle.")
  matches the fixture, including your observation that the audible return
  is the plain lower voice. I moved A3's own return earlier (16–17.5 s,
  while the pedal still holds it) so that return is heard too; the
  fixture test asserts it.
- The headroom refusal ("exceeds the study's output headroom") refuses
  rather than rescales; honest.

## Nits
- Phase captions (STILLNESS/CHANGE/ANSWER/RETURN at 4/9/16 s) are
  hardcoded in `main.js`; the fixture now exports
  `EXPRESSIVE_STUDY_PHASES` with the same numbers and a description each,
  so the page can read them and they cannot drift from the score.
- `prepare` rebuilds the performance at the context's rate and assigns
  the global `passage`, which `draw` then uses; correct, but a comment
  would save the next reader a minute.
- The voice cards say "Settled" after retirement; the evaluator says
  nothing about ending (by contract), so "Settled" is the adapter's word.
  Fine; keep it the adapter's.
