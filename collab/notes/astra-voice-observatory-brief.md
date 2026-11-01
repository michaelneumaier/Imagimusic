# Voice Observatory — parallel project brief

Michael's direction, 2026-10-31: vocalize into a responsive interface that reveals the many layers of the voice, beginning with ordinary voice and growing toward humming, unusual articulations and beatboxing. Continue the Conservatory in parallel. Astra has handed the roadmap/proposal to Fable; this brief records the initial product and evaluation commitments.

## Experience

A living visual instrument you play with your own voice. Pitch moves a lattice of harmonic threads; the measured spectrum controls their relative strength. Broad resonance bands change shape as vocal color changes. Breath and friction become a diffuse field; consonants, clicks and percussive attacks create localized impulses. Silence settles the scene without leaving a false held note.

Two linked views: an analytical spectrum/spectrogram with feature confidence, and an expressive scene whose mappings can be inspected. Confidence changes opacity or label availability, not an invented anatomical explanation. Distinguish optional visual persistence from current sound. Harmonics and spectral-envelope resonances must remain visually separable: changing pitch and changing vowel are different gestures.

## Scope and milestones

1. **Normal voice mirror:** explicit microphone start/stop, local processing, level/spectrum, pitch candidate and periodicity confidence, harmonic strengths when voiced, breath/noise texture and onset impulses. Exercise sustained vowels, pitch slides, speech, humming, breath and silence. Humming gets meaningful raw-spectrum feedback even when higher-level interpretations are unavailable.
2. **Resonance portrait:** estimated formants with calibration, uncertainty and dropout behavior; compare vowel changes at steady pitch and pitch changes on a steady vowel. Never label each spectral peak as a formant. Nasal and closed-mouth sounds may violate the ordinary-vowel model; show the spectrum faithfully rather than force a fit.
3. **Articulation and beatbox atlas:** multiple analysis timescales for fast attacks, friction, subharmonics and mixed periodic/noisy sounds. Permit multiple plausible pitch structures or no pitch. Build evaluations from consented examples; don't require every sound to belong to a known syllable class.
4. **Creative performance:** map verified features into the Conservatory's state/binding system, record feature trajectories only by explicit choice, and render repeatable visual performances. Later exploration may include physical-model inversion or additional sensors, but anatomical attribution is not an MVP claim.

## Engineering direction

Capture -> audio-thread sample collection -> bounded analysis buffers -> feature frames with timestamps/confidence -> analytical and expressive renderers. Request unprocessed capture where supported and show the actual track settings. No microphone-to-speaker monitoring by default, no raw-audio upload or recording by default. Stop releases microphone tracks; capture errors and device changes are explicit.

Use a fast envelope/onset path alongside longer spectral/pitch windows. Initial exploration: ~10 ms feature hop and roughly 20–50 ms voiced-analysis windows, with longer windows where low pitches need more cycles. These are starting parameters, not promises of sufficient precision. Render at the display cadence. No zero-latency claim; measure event-to-visible-response latency. Proposed reference-system target: p95 <=100 ms with a wired/USB microphone, reported with hardware/browser and separate capture, analysis and rendering timing. Select input independently of AirPods listening output; verify the actual capture behavior rather than assuming equal latency or bandwidth across devices.

Feature records should preserve validity and units: level in digital full-scale units (not calibrated sound pressure), F0 candidate in Hz plus confidence, timestamp/window span, harmonic magnitudes, spectral envelope, centroid/flatness, onset strength, optional formant candidates with confidence. Avoid mapping low confidence to numeric zero Hz.

## Evidence required before calling it faithful

- Known harmonic stacks and glides: pitch error and octave-error counts, harmonic amplitudes, repeatable feature frames.
- Noise, silence and voiced/unvoiced transitions: no confident phantom pitch; fast clearing of invalid tracks.
- Synthetic source/filter examples: distinguish known resonant filter peaks from source harmonics.
- Human vowels, humming, breath and connected speech across pitch ranges: inspect synchronized sound, spectrum and visual response. Compare formant estimates against an established analysis workflow with manual review.
- Transient-to-pixel latency measurements and frame-time distributions, not visual smoothness alone.
- Mic stop/device change/privacy behavior verified in actual supported browsers.

A microphone records the resulting pressure signal at one position; it does not uniquely reveal vocal-fold, false-fold, lip, tongue or tract motion. The long-term goal is sensitivity to their audible effects. Anatomical labels require additional evidence and remain a separate research track.

## Primary references

- [YIN, de Cheveigné & Kawahara (2002)](https://pubmed.ncbi.nlm.nih.gov/12002874/): candidate F0 estimation method; not an articulation classifier.
- [Praat Burg formant analysis](https://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html): LPC formulation, ceiling sensitivity and spurious-pole caveats.
- [W3C Web Audio API](https://www.w3.org/TR/webaudio/): processing architecture. Current linked specification is a draft; implementation support must be checked separately.
- [W3C Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/): explicit capture, constraints, settings and track lifecycle.
