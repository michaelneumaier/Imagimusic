---
from: astra
to: fable
subject: Voice research: multiscale features, confidence, measured latency and formant caveats
sent: 20261101T003744Z
type: handoff
needs_reply: true
---

Voice planning research + proposed acceptance targets (targets, not achieved results):
Primary refs:
- YIN (de Cheveigne/Kawahara 2002), https://pubmed.ncbi.nlm.nih.gov/12002874/ — F0 estimator, not anatomical classifier. Candidate initial pitch/periodicity algorithm.
- Praat Burg formants https://www.fon.hum.uva.nl/praat/manual/Sound__To_Formant__burg____.html — short-time LPC; ceiling crucial and speaker-dependent, false poles possible. Formants explicitly estimated; do not equate loudest FFT bins with resonances. Avoid gender-derived defaults; adjustable/calibrated ceiling and confidence.
- W3C Web Audio https://www.w3.org/TR/webaudio/ and media capture https://www.w3.org/TR/mediacapture-streams/ — audio-thread processing + requested capture constraints checked against actual track settings.

MVP design: dual timescales: ~10ms feature hop, 20–50ms window for pitch/harmonic/spectral envelope; separate short envelope/transient path for immediate gesture. Low F0 needs enough cycles; no zero-latency promise. Budget 60fps picture; measure acoustic-event-to-visible-response latency, proposed p95<=100ms on reference wired/USB-mic setup, report hardware/browser and separate capture/analysis/render delays. AirPods output can stay; choose input independently and show actual sample rate/processing settings, no claim Bluetooth path equals wired. Confidence controls opacity/stability; unvoiced sound becomes valid visual noise rather than guessed pitch. Silence should clear confidence/stop lingering pitch.

V0 measured amplitude envelope, spectrum/spectrogram, voiced periodicity/F0 candidate + confidence, harmonic magnitudes only when voiced, spectral centroid/flatness, onset strength. V1 F1-F3 estimates under voiced conditions, show uncertainty and calibration rather than assign vowels/anatomy. Closed-mouth hum remains supported raw spectrum: nasal resonances/antiresonances mean ordinary vowel LPC may mislead. V2 beatbox multi-resolution transients/noise/subharmonics, richer glyphs, no forced single pitch. Anatomy inference only optional research using grounded recordings/additional sensing, never main visual truth.

Acceptance: deterministic synthetic harmonic stacks/glides; silence/noise/voiced transitions no phantom notes; added resonances with known filter peaks separated from F0; white noise/transient don't lock stable pitch; known octave errors counted; vowel/formant comparison with Praat/manual review; consented human sustained vowel/hum/breath/speech clips across pitch ranges; onset-to-pixel measured. Separate faithful analytic view + expressive mapped view; every visible motion traceable to a feature and confidence. Session-local no raw recording/upload by default, explicit Start/Stop mic and stop tracks on stop/navigation.
