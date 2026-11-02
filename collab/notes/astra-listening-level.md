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


## Pulse, Adapt and Powered

Pulse now uses +18 dB for its single continuous opening/answer host. Adapt uses
+18 dB for its one replay instance, so Original and Changed receive the same
gain. Powered uses +18 dB for live and replay together. All share the guarded
single-instrument preference with Rest. Original-level saved-audio notes are
visible; interim quiet-level notes are removed on these three routes. Grove
and the generated listening-study players remain the next batch.

Native Safari: Pulse reached THE BODIES ARE YOURS, accepted S and ended on
Escape with keeping controls. Adapt's prepared pair remained silent until
choice, both Original and Changed reached Listening, then Escape stopped it.
Powered Begin completed its encounter; Listen back reached LISTENING BACK and
then SETTLED with Quiet disabled.

Prepared Adapt pair measured from canonical float PCM: after +18 dB, original
peak0.1347724914 and changed0.1356141048; zero samples above0.95 in either.
Report: renders/adaptation-listening-level/report.json. Only this example is
covered; arbitrary imported files can reach the ceiling. Equal gain is not a
claim of equal perceived loudness.

Powered host tests:13 pass, including unchanged canonical capture, disposal,
selected-level restoration and failed-stage retry. Fable independently checked
the exact default preparation on seeds3/7/11 at48k, free and hand at each zone
from0.5–2s: all nine cases had zero samples above0.95 after+18dB. Highest boosted
peak about−9.6dBFS. These fixture checks do not prove an arbitrary performance
cannot clip or establish phone audibility.

Reviews:
- collab/reviews/20261102T0104Z-fable-reviews-pulse-adapt-listening.md
- collab/reviews/20261102T0106Z-fable-reviews-powered-listening.md
The latter corrected an initial comparative claim: powered peaks are in the
same range as Rest invitation strikes, not well below them.


## Ordinary Grove: distinct default

The shared impulse transport accepts an optional downstream listening stage,
with null bypass for other callers. Grove configures both live and replay at
+12 dB under its own imagimusic-grove-listening-db preference. Saved sound,
film preview and exported films remain at original model level, declared by
the keeping controls. Eight transport tests pass, including unchanged captured
PCM and Quiet fade, passage-bus routing, disposal and failed-connection retry.

Six authored greetings (seeds 3/7/11, original and partials voices) measured at
48 kHz are recorded in renders/grove-listening-level/report.json. None reaches
0.95 at +18 dB, but the loudest original voice peaks at 0.741 after that boost.
Fable correctly requested a lower default and separate preference: ordinary
strong playing needs room beyond the greeting. At the adopted +12 dB that
greeting peaks at about 0.371. Arbitrary playing can still meet the ceiling;
this is not a guarantee of unchanged tone for every gesture.

Native Safari original voice: enter, held A, Escape, replay completion, new
passage, greeting and Escape succeeded with the initial +18 dB configuration.
Reload after revision displayed +12 dB and the distinct-default disclosure.
Review: collab/reviews/20261102T0113Z-fable-reviews-grove-listening.md; its
lower-default finding is applied. No direct phone audibility or comfort verdict.

At the revised +12 dB default Safari also prepared, accepted a 650 ms A hold,
finished on Escape and reached LISTENING BACK then settled with Quiet disabled.
Fable confirmed the revised configuration in message
20261102T011319Z-fable-to-astra-grove-configuration-confirmed-7c14e1a-12-db-live-719e5590.md.


## Generated listening studies

The shared openPhrasePlayer now uses one media-element source and the reviewed
listening stage. Both Rest phrase studies default to +18 dB on the Rest key;
the harmonic study defaults to +20 dB on the ensemble key. All examples within
a comparison share one stage. Preparing the graph happens only on explicit
selection. The media source survives stage-connection failure so retry does
not attach the same element twice. Three adapter tests cover reuse, failure
cleanup/retry and pause during pending resume without a deferred play call.

All three studies were regenerated. Sixteen WAVs, including harmonic parts,
match their prior SHA-256 hashes exactly. Ten selectable examples have zero
samples above 0.95 at their default gain (phrase peak0.1788984; harmonic peaks
0.1330566/0.1458740). These are decoded PCM sample checks, not a device-output
or perceived-loudness measurement. Report:
renders/listening-level/study-player-verification.json.

Native Safari: all three pages initialize without playback; explicit selection
starts the media player. Rapid timing-study and harmonic-study switching leaves
only the latest example selected. Volume changes update the readout; the tested
Rest preference was restored to18, and the recurrence page restored that value.
The harmonic page correctly restored the existing ensemble preference10 rather
than overwriting it with default20. Navigation during recurrence playback and
Back returned a fresh idle page with no autoplay (not a retained bfcache test).

Fable review approves with no findings:
collab/reviews/20261102T0116Z-fable-reviews-study-listening-player.md.
Original WAVs remain the canonical files. Media controls are browser-provided.
