# Proposal 005: Voice Observatory

*Fable, 2026-11-01, at Astra's request relaying Michael's new parallel
direction. Planning only: no microphone code until this plan is agreed. The
Conservatory (stage) work continues in parallel and keeps priority.
Incorporates Astra's DSP research message of 2026-11-01 (references,
acceptance targets).*

## Vision

You make a sound with your own voice and the observatory answers instantly
and in detail: every harmonic a filament, every resonance a chamber, breath
a mist, a click a shock. Start with the ordinary voice (sustained vowels,
hums, breath). Grow toward articulation and transients, then beatboxing and
unusual phonation. The feeling to protect is the same as the rest of
imagimusic: watching explains hearing, and nothing on screen pretends to
know more than the microphone can.

## The honesty rule for a microphone

A microphone measures one pressure signal. From it we can **measure**,
**estimate**, or **infer**, and the picture labels which is which, exactly as
the stage labels physical vs. interpreted:

| Tier | Examples | How shown |
| --- | --- | --- |
| **Measured** (computed directly from the signal with a stated window) | amplitude envelope, short-time spectrum, spectral centroid and flatness, onset strength | solid, always present |
| **Estimated** (model-based, with a confidence) | voicing, fundamental frequency (F0), harmonic magnitudes given F0, formant frequencies F1–F3, subharmonic ratio | opacity and stability follow confidence; vanish gracefully when confidence falls |
| **Inferred** (not uniquely determined by the acoustic signal) | vocal-fold vibration mode, tongue/jaw position, nasal port opening, false-fold or whole-tract participation | **never the main visual truth**; optional research view only, with grounded recordings or extra sensing, clearly labeled as inference |

The inverse problem is ill-posed: many tract shapes produce the same
spectrum (source–filter theory: the spectrum is source × filter, and a single
signal does not factor uniquely). So: no anatomical certainty, no diagnosis,
no "your false folds are engaged." We can say "a strong sub-octave component
appeared" and show it.

## Visual grammar (creative, causality-preserving)

Two views, both driven by one feature frame, both inspectable:

1. **Faithful analytic view**: spectrogram, F0 track with confidence band,
   harmonic markers, formant estimates with uncertainty bars, latency
   readout, device settings. The reference the mapped view is checked
   against.
2. **Expressive mapped view**, the observatory:
   - **Harmonic filaments**: one strand per harmonic when voiced; length =
     magnitude, position = frequency on a log axis, hue drifts with the
     harmonic's deviation from exact integer ratio; strands braid when pitch is
     stable and unravel on vibrato. Confidence = opacity.
   - **Formant chambers**: two or three chambers (F1–F3) whose aperture tracks
     the estimate and whose wall thickness is the uncertainty. Labeled
     "estimated". For closed-mouth hums, chambers dim and visible dark bands
     mark **dips in the estimated spectral envelope**; a dip is not identified
     as a nasal antiresonance unless a model supports that, so the label stays
     "envelope dip."
   - **Noise mist**: unvoiced energy as fog; density from spectral flatness,
     color from centroid, drift from the envelope. Unvoiced is a valid state,
     not a failed pitch.
   - **Transient impulses**: onset strength spawns a ring or shock whose size
     is the measured energy jump; multi-resolution for beatbox (kick vs
     snare vs hi-hat textures emerge from band energies, not from labels).
   - **Breath vessel** (artistic): the amplitude envelope fills a
     bellows-like vessel; breath noise alone shows as mist from it. The vessel
     is a level display, not measured breath pressure or airflow, and its
     caption says so.
   - **Silence**: everything settles within ~150 ms; no lingering pitch.
   Every motion is a binding (`src/bindings.js`) from a feature field with a
   confidence input, so the inspector can answer "why did this move?" here
   too.

## Staged roadmap (parallel track V), consolidated with Astra's brief

*Astra's product/evaluation brief lives at
`collab/notes/astra-voice-observatory-brief.md`; its four milestones are the
four stages below, so there is one roadmap. Its additional commitments are
folded in here and marked (A).*

| Stage | Scope | Features | Acceptance (targets, not results) |
| --- | --- | --- | --- |
| **V0 Normal voice mirror** | sustained vowels, pitch slides, speech, hum, breath, silence; one speaker; wired/USB reference mic | amplitude envelope in digital full-scale units, not sound pressure (A); spectrum; voicing + F0 candidate + confidence (YIN-class estimator), never rendered as 0 Hz when confidence is low (A); harmonic magnitudes only when voiced; centroid/flatness; onset strength | synthetic harmonic stacks and glides tracked within 1% with no octave flips on steady tones; counted octave errors on glides; silence/noise/voiced transitions produce no phantom notes and invalid tracks clear fast; white noise and clicks never lock a stable pitch; hums get meaningful raw-spectrum feedback even with no higher-level estimate (A); onset-to-pixel latency measured, p95 ≤ 100 ms on the reference setup |
| **V1 Resonance portrait** | formant estimates, calibration, dropout | F1–F3 via short-time LPC (Burg) with an adjustable, calibrated ceiling and confidence; spectral-envelope dip bands for hums and nasal sounds (not identified as antiresonances unless a model supports it) | known added filter peaks recovered separately from source harmonics; **changing pitch at a steady vowel and changing vowel at a steady pitch read as two different gestures** (A); vowel comparisons against Praat and manual review on consented clips; uncertainty shown, no spectral peak ever labeled a formant by default, vowels never named as fact |
| **V2 Articulation and beatbox atlas** | transients, friction, noise bursts, subharmonics, mixed periodic/noisy sounds | multi-timescale onset detection; band energies; subharmonic ratio with confidence; multiple plausible pitch structures or none (A) | beatbox clips: kick/snare/hat textures distinguishable by band energy without labels; subharmonics shown when present; no stable-pitch lock on noise; no requirement that every sound belongs to a known class (A) |
| **V3 Creative performance** | the observatory joins the Conservatory | verified features enter the state bus as a `voice` family and drive stage bindings; feature trajectories recorded only by explicit choice (A); repeatable FrameClock renders from recorded features | a recorded feature stream re-renders identically (trace hashes); visual persistence (trails, afterglow) is visibly distinct from current sound (A); every motion traceable to a feature and a confidence |
| **Research track (off the main line)** | anatomy inference, physical-model inversion, extra sensors | only with grounded recordings or additional sensing; a separate research view | never shown as the main visual truth |

## Engineering plan

- **Dual timescale**: ~10 ms feature hop with 20–50 ms windows for pitch,
  harmonics, and spectral envelope; a separate short envelope/transient path
  for immediate gesture. Low F0 needs enough cycles per window, so there is no
  zero-latency promise; the readout says what the window is.
- **Threads**: capture → AudioWorklet collects sample blocks (audio thread,
  kept trivial) → bounded buffers handed to a Worker for the heavier analysis
  (YIN, LPC, spectral envelope) → feature frames posted at the hop rate →
  main thread picture at 60 fps. The worklet budget is benchmarked before
  any analysis is allowed on the audio thread; an overrun there is an audible
  glitch for everything else on the page, so the default is worker-side
  analysis with a buffered handoff.
  Feature frames are plain data and enter the state bus as a `voice` family,
  so bindings, inspector, and trace hashing work unchanged.
- **Latency measurement**: software can measure some components (capture
  block arrival to feature frame, feature frame to draw call, frame-time
  distribution) and a click loopback self-test (speaker → room → mic) that
  estimates a round trip including DAC, acoustics, and capture. It **cannot**
  isolate true mouth-to-pixel latency: that needs external evidence (a camera
  or photodiode on the screen with a reference microphone, or a hardware
  loopback). We report the software-measurable components with their
  definitions, label the loopback number as a round-trip estimate, and treat
  the p95 ≤ 100 ms target as something to verify externally before claiming. Bluetooth input is allowed
  but shown as such; the AirPods can stay on output, input is chosen
  independently, and the actual track settings (sample rate, echo
  cancellation, noise suppression, auto gain) are read back and displayed,
  not assumed.
- **Noise and device calibration**: a one-second ambient profile on user
  request sets the noise floor; the spectrum shows the floor; features below
  it count as unvoiced. Request processing off (echo cancellation, noise
  suppression, AGC) and verify against the track's actual settings.
- **Confidence and graceful unvoiced behavior**: periodicity confidence
  drives opacity and a hysteresis gate (enter voiced above c₁, leave below
  c₂ < c₁) so filaments do not flicker; unvoiced sound becomes mist; silence
  clears confidence within a stated time.
- **Privacy and safety**: local only, session only. Explicit Start and Stop
  microphone buttons, a visible indicator while live, tracks stopped on Stop,
  on device change, and on page navigation, with capture errors shown rather
  than swallowed (A). No microphone-to-speaker monitoring by default (A): the
  observatory is silent, it only draws. No recording or upload by default.
  Saving a clip for evaluation is a separate explicit action, stays on the
  user's machine, and is labeled.
- **Feature record contract** (A): every frame carries timestamp and window
  span, level in dBFS, F0 candidate in Hz with confidence (or absent, never
  0 Hz), harmonic magnitudes, spectral envelope, centroid, flatness, onset
  strength, optional formant candidates with confidence. Units and validity
  travel with the numbers.
- **Determinism**: all feature extraction is pure math on sample blocks, so
  it runs in `node:test` on synthetic signals and on consented clips; the
  observatory can be driven from a recorded feature stream for the stage's
  FrameClock renders.

## Evaluation

- Synthetic: harmonic stacks, glides, vibrato, white and pink noise,
  impulses, known filter peaks over a stack, stacks with added subharmonics.
- Human: consented sustained vowels, hums, breath, speech across pitch
  ranges; beatbox clips later. Formant comparison with Praat.
- Live: listening sessions with Michael with the analytic view beside the
  observatory; the question each time is "does the picture show what I just
  did, and only that?"
- Latency: the click self-test, reported per setup.

## References (to read before implementing; claims above stay within them)

- de Cheveigné & Kawahara (2002), YIN, a fundamental frequency estimator:
  https://pubmed.ncbi.nlm.nih.gov/12002874/
- Praat, Sound: To Formant (burg):
  https://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html
- W3C Web Audio API: https://www.w3.org/TR/webaudio/ ; Media Capture and
  Streams: https://www.w3.org/TR/mediacapture-streams/
- Fant, *Acoustic Theory of Speech Production* (1960): source–filter model,
  why the signal does not factor uniquely.
- Stevens, *Acoustic Phonetics* (1998): formants, nasalization and
  antiresonances.
- Titze, *Principles of Voice Production* (1994): what fold behavior is and
  isn't recoverable from acoustics.
- Proctor et al. (2013), real-time MRI of beatboxing, J. Acoust. Soc. Am.:
  articulations in beatboxing are varied and not inferable from sound alone.
  (Citation to be verified when V2 is scoped.)
- McLeod & Wyvill (2005), MPM pitch estimator, and CREPE (Kim et al. 2018)
  as later alternatives if YIN's octave behavior proves limiting.

## Limitations, stated up front

- Formant estimation is speaker- and ceiling-dependent and can produce false
  poles; it is an estimate with a confidence, never a fact.
- Closed-mouth sounds break the vowel-LPC assumptions; we show raw spectral
  structure and envelope dips, not formants and not identified antiresonances.
- Beatbox and unusual phonation produce signals a single-pitch model cannot
  describe; we never force one pitch.
- Anatomy is not recoverable from a microphone; the observatory shows what
  the sound did, not what the body did.

## Decisions for Astra

1. Approve the three tiers (measured / estimated / inferred) as the voice
   analogue of physical / interpreted, and the V0 → V3 staging.
2. Ownership: Fable: feature extraction math + synthetic evaluation suite
   (`src/voice/features.js`, pure, `node:test`); Astra: capture/Worklet
   plumbing, device readback, latency self-test, observatory bodies on the
   stage. Or reassign.
3. V0 acceptance numbers as written (1% tracking, p95 ≤ 100 ms) or amend.
