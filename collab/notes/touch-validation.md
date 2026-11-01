# Touch. Listen. Answer. — Astra validation, 2026-11-01

## Behavior and model boundary

Two held pads (or F/J) apply a bounded velocity impulse to the coupled Loom. Existing ringing responses superpose. Both unit buffers use the same pickup normalization and fixed .45 output gain. New gestures do not alter old gains. Admission uses a conservative sum-of-modal-magnitudes bound, including the proposed gesture, against .9 output headroom. Capacity is128 gestures/120seconds. The scene draws the existing displacement envelopes, not audio-rate mechanical motion or energy. Camera is still by default, with manual orbit available. Fable's answerPeak/stillnessBound/meeting provide optional disclosure and restrained cues; they make no inner-state claim.

Quiet records an end frame and25ms fade. The live bus and saved renderer share that ending. Saving an unfinished passage includes its complete response. Changing bridge/New passage replaces the current capture. JSON is output only; no untrusted recording import or touch-to-movie export is exposed. Stage's whole-score gain normalization is intentionally not used for a touch capture.

## Evidence

- Full Node suite273/273 passed. Touch session/transport5/5 covers fixed gains and headroom refusal, exact onset frames and Quiet fade, reverse visual sampling, bus scheduling and stale bank preparation.
- Safari26.6.2 desktop: explicit entry, F/J and pointer holds, overlapping gestures, response cues, Quiet, WAV and JSON downloads. Initial stage transform corrected, then both bodies/pads inspected in the centered scene. Reentry resets old cues; cached visual passage avoids per-frame eigen-solves.
- Safari Responsive Design Mode400×656: both complete bodies and both pads visible after entry; labels fit after reducing pad padding and adapting scene height. Held pointer pads recorded two gestures; Quiet worked. This checks responsive desktop Safari, not physical iOS multitouch. Returned browser to normal mode.
- `renders/touch-first-play.json` and `.wav`: two actual pointer gestures at48kHz. Independent Node recreation from recorded settings/frame onsets/velocities/end and generated unit bank produced byte-identical PCM16 WAV (710184bytes).
- `tests/touch-audio.html` uses the actual exported live scheduling helpers in OfflineAudioContext, comparing to saved-buffer summation. Four cases cover all three bridges,44.1/48kHz, full tails and Quiet. `renders/touch-audio-report-v2.json`:4/4pass. Maximum live-scheduler/saved-mix discrepancy2.98023e−8 full scale; relative RMS residuals about−145.5 to−146.4dB. Peak at most.2132 for these fixtures. Repeated graph discrepancy at most1.45519e−11 (full-tail case), other three exact.
- Initial exact-repeat assertion failed on a7.28e−12 residual, preserved in `renders/touch-audio-initial-exact-repeat.json`. Final criteria explicitly permit1e−7 repeated-graph error and1e−6 saved-mix error; no bit-exact browser-graph claim. Saved representation/reconstruction was separately byte-identical in the measured case.

Offline graph comparison does not capture speakers, device latency, or a physical live audio device. No cross-browser equivalence claim. Model is a reduced linear mass/spring system with explicit pickup scaling and finite fades, not full acoustic radiation.

## Actual peer review

Fable approved session in `collab/reviews/20261101T0537Z-fable-reviews-touch-session.md` and page/transport in `collab/reviews/20261101T0541Z-fable-reviews-touch-page.md`. Addressed visual caching, use of normalized stillness bound, and wording about this touch rather than a future swell. Numerical tolerance evidence sent separately in canonical mailbox.

## Interruption recovery follow-up

AudioContext state changes now expose Resume when audio is suspended or interrupted. Resuming preserves the existing bank, origin and captured gestures rather than starting over. A fake-context regression test verifies refusal of a silent strike during interruption, retention of the first gesture and correct onset of the next after resume. Focused touch suite6/6 passed; actual OS/device interruption is not claimed as tested. This does not alter the impulse rendering or save algorithm.
