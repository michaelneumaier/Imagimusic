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
     "estimated". For closed-mouth hums, chambers dim and a visible dark band
     marks spectral antiresonance regions without claiming "nasal."
   - **Noise mist**: unvoiced energy as fog; density from spectral flatness,
     color from centroid, drift from the envelope. Unvoiced is a valid state,
     not a failed pitch.
   - **Transient impulses**: onset strength spawns a ring or shock whose size
     is the measured energy jump; multi-resolution for beatbox (kick vs
     snare vs hi-hat textures emerge from band energies, not from labels).
   - **Breath as pressure**: the amplitude envelope fills a bellows-like
     vessel; breath noise alone shows as mist from the vessel.
   - **Silence**: everything settles within ~150 ms; no lingering pitch.
   Every motion is a binding (`src/bindings.js`) from a feature field with a
   confidence input, so the inspector can answer "why did this move?" here
   too.

## Staged roadmap (parallel track V)

| Stage | Scope | Features | Acceptance (targets, not results) |
| --- | --- | --- | --- |
| **V0 Normal voice** | sustained vowels, hum, breath; one speaker; wired/USB reference mic | amplitude envelope; spectrum; voicing + F0 candidate + confidence (YIN-class estimator); harmonic magnitudes only when voiced; centroid/flatness; onset strength | synthetic harmonic stacks and glides tracked within 1% with no octave flips on steady tones; counted octave errors on glides; silence/noise/voiced transitions produce no phantom notes; white noise and clicks never lock a stable pitch; onset-to-pixel latency measured, p95 ≤ 100 ms on the reference setup |
| **V1 Resonances** | formant estimates and calibration | F1–F3 via short-time LPC (Burg) with an adjustable, calibrated ceiling and confidence; antiresonance bands for hums | known added filter peaks recovered separately from F0; vowel comparisons against Praat and manual review on consented clips; uncertainty shown, vowels never named as fact |
| **V2 Articulation and beatbox** | transients, noise bursts, subharmonics | multi-resolution onset detection; band energies; subharmonic ratio with confidence; no forced single pitch | beatbox clips: kick/snare/hat textures distinguishable by band energy without labels; subharmonics shown when present; no stable-pitch lock on noise |
| **V3 Research (optional)** | anatomy inference | only with grounded recordings or extra sensing; a separate research view | never shown in the main observatory |

## Engineering plan

- **Dual timescale**: ~10 ms feature hop with 20–50 ms windows for pitch,
  harmonics, and spectral envelope; a separate short envelope/transient path
  for immediate gesture. Low F0 needs enough cycles per window, so there is no
  zero-latency promise; the readout says what the window is.
- **Threads**: capture → AudioWorklet feature extraction (audio thread) →
  feature frames posted at the hop rate → main thread picture at 60 fps.
  Feature frames are plain data and enter the state bus as a `voice` family,
  so bindings, inspector, and trace hashing work unchanged.
- **Latency measurement**: a self-test that plays a click through the
  speakers, captures it, and measures capture, analysis, and render delays
  separately; reported with hardware and browser. Bluetooth input is allowed
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
- **Privacy**: local only, session only. Explicit Start and Stop microphone
  buttons, a visible indicator while live, tracks stopped on Stop and on
  page navigation. No recording or upload by default. Saving a clip for
  evaluation is a separate explicit action, stays on the user's machine, and
  is labeled.
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
  structure and antiresonance bands, not formants.
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
