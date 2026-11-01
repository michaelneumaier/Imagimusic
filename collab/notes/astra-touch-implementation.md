# Touch instrument implementation notes (013, Astra)

Approved Fable's model exploration with corrections in mailbox 20261101T053150Z: first maximum is a swell, not arrival; stillness requires a conservative future bound, not the first beat minimum; meeting concerns a named amplitude metric, not global energy.

A source read showed existing Loom workbench resets on each strike. Continuous interaction therefore needs a new live layer. Proposed contract sent 20261101T053254Z: cache the two unit impulse stereo buffers with a common pickup scale and fixed .45 output gain; overlap at sample-aligned AudioContext onsets and retain exact onset frame and velocity. Conservative decaying modal bound admits early strikes while keeping mix below .9; never renormalize history. Waiting for Fable's critique/helper before finalizing dependent code.

Planned page: `touch.html`, `touch.css`, `src/touch/**`, `tests/touch-*`, Astra ownership. Two pads with F/J equivalents, hold up to 600 ms to set impulse strength (.25–1), no autoplay; quiet default camera, restrained centered scene. A clear first activation prepares the cached audio. One small cue points to the untouched body's response. Three fixed bridges use existing journey settings; changing bridge explicitly starts a new system. Record locally, save session JSON and complete audio. No public service or publishing.

Open transport detail: quiet must have a defined saved-audio meaning. Prefer ending the passage with an explicit recorded fade time; subsequent play starts a new passage, never silently reconnects to a past ring that was cut. Export must reconstruct that fade as well as the impulses. Future-tail silence and measured amplitude are model disclosures; no countdown or performance score in the primary interaction.

## Working prototype, 2026-11-01 05:39 UTC

`touch.html/css`, `src/touch/session.js`, `transport.js`, `main.js`, tests touch-session/transport are now implemented. Five Node tests pass. Fable approved session normalization/headroom contract in review 20261101T0537Z. Cached visual passage addresses his performance nit. Page uses his normalized stillnessBound for its cue.

Safari: explicit entry prepares unit responses; F/J hold/release and pointer holds each generate two recorded gestures; Quiet ends/fades; sound and JSON download. Fixed a scene placement issue (world's default Loom transform must be reset), then verified both bodies and pads in one centered view with sticky controls. Local artifacts `renders/touch-first-play.json` and `.wav`: 48k stereo, 2 gestures (frame0 velocity.88125 left; frame15104 velocity.57875 right), Quiet frame176335 fade1200frames. Independent Node recreation from the saved JSON and generated unit bank produces byte-identical WAV (710184bytes). This proves saved representation/reconstruction, not live browser graph equality.

Next: browser OfflineAudioContext mixing harness comparing scheduled buffers+Quiet bus fade to renderTouchRecording; mobile view and interaction edge cases; full test suite and Fable UI/transport review; link into listening doorway, README and checkpoint commit. Capture JSON file import and movie export are not exposed. Existing whole-score render normalization is unsuitable for this fixed-gain live capture without an adapter; no unchanged-stage-verifier claim.
