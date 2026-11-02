# Ensemble listening level — November 2, 2026

Phone feedback relayed by Fable: the instruments are difficult to hear. The
ensemble prototype now has a declared playback-only boost, default +20 dB,
adjustable 0–20 dB under Listening volume. The chosen value is remembered only
in this browser; unavailable localStorage is tolerated. No automatic playback.

Graph: processor → GainNode → WaveShaper sample ceiling ±0.95 → destination.
Gain changes ramp over 30 ms. The 8193-point piecewise-linear curve is linear
below the ceiling and clips larger samples; strong transients can distort.
This is neither a true-peak limiter nor a guarantee of comfortable device volume.
The canonical model, admission rules, records and offline WAVs are unchanged.
The keeping panel explicitly says that the original-level WAV can be quieter.

Ten focused tests pass, including unchanged saved records after gain changes.
Fable reviewed the method and recommended this ensemble default in
collab/reviews/20261102T0021Z-fable-reviews-listening-level.md.

Native Safari offline graph diagnostic: tests/listening-level.html, explicit
Run, no output sent to speakers. At 0 and20 dB, 2304 samples per channel at48k:
maximum error relative to interpolated curve 4.85e-8 and1.03e-8; peak
0.949999988. Report: renders/listening-level/safari-offline-graph.json.
This is signal-graph correctness, not device output or realtime evidence.

Independent kept-WAV measurements: renders/listening-level/source-levels.json.
The short live-middle capture peaks at −38.67 dBFS (RMS−48.73);
the diagnostic ensemble peaks at −37.52 (RMS−52.74). Neither reaches the
ceiling after +20 dB. These are Astra test captures, not Michael performances.
Peak/RMS measurements are not a general loudness equivalence or proof of the
phone speaker's response.

Native integrated page: default+20 displayed, Begin prepared, A/S/D played
through the stage and Escape ended normally with keeping controls. Changing
to+10 displayed that value and retained it after reload; no audio resumed.
No subjective claim about audibility is inferred from the successful controls.

Next: phone listening feedback and single-instrument/replay integration at a
declared common level; an optional listening-copy export requires an explicit
policy and different filename. No saved WAV was silently replaced.


## Rest and saved-reader integration

Rest now explicitly configures +18 dB for both live host and replay; the
single-passage reader uses the same preference key. The ensemble reader uses
+20 dB and the ensemble preference key. A shared control restores one validated
value, updates every audio target on its page together, and tolerates disabled
or corrupt localStorage. Other unconfigured host/replay callers retain a null
bypass. Pulse, Powered, Grove and Adapt carry interim original-level wording
until their matched live/replay paths are integrated.

The added stages dispose on park and rebuild with the chosen level in a new
context. Failed stage connections dispose the partial stage and retry rather
than quietly bypassing it. Sixteen host/replay/control tests pass, including
unchanged source PCM/records, stored preference validation, lifecycle cleanup
and explicit failure/retry. Fable initial review approved in
collab/reviews/20261102T0100Z-fable-reviews-rest-listening-stage.md; the small
failure/retry follow-up was sent separately for inspection.

Native Safari: Rest Enter, authored invitation, automatic Quiet, Listen back
and natural replay completion all succeeded. The disclosure showed +18 dB for
both paths. The saved-file reader initialized silently and also showed +18 dB.
The downloaded invitation record and WAV are kept in renders/rest-listening-level.
Independent canonical reconstruction equals the WAV byte-for-byte: 961200frames
at48k, six strikes and three contacts, SHA-256
885180a02657ddc0a81ed1401fbea3273752bb88aa15d40812f6f8334423a831.
The download is original-level model sound, not captured boosted output.
This does not establish comfort or audibility on a phone.
