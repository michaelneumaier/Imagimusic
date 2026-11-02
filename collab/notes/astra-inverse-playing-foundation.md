# Inverse playing foundation — 2026-11-02

The next encounter connects a deliberately small sound description to several playable anatomies. Its invitation is to listen for what a target leaves undecided: matching three resonances and a common decay does not fix how each touch travels through a body. This is a concrete route toward the project's interest in attention and altered perception, without asserting consciousness or adding spiritual symbols as decoration.

## Implemented

- `src/inverse/instrument.js`: a validated immutable canonical Grove rendered as exactly three lumped masses, common damping and bridge springs. Fixed 0.01 N·s impulses, displacement gain 8, virtual pickups on bodies 1 and 3. No richer Grove voice partials. Picture envelopes and sound share response time; envelopes are an interpretation rather than audio-rate deformation.
- `prepare-worker.js` and `jobs.js`: bounded solver and candidate rendering run in disposable module workers. Replacement and cancellation terminate the old worker; stale messages cannot replace a newer result. Completed stereo channels transfer to the caller. Preparation is silent.
- `transport.js`: candidate mounting is silent and transactional. Explicit strikes require a running AudioContext, use its observed clock, and admit at most eight simultaneous responses. A ringing candidate cannot be replaced until its sound ends or Quiet is used. Quiet stops every active source and clears the picture. Invalid preparations retain the previously mounted candidate.

The single-strike output bound is approximately 0.015916; eight simultaneous strikes have a conservative linear sum bound below 0.128 before any future listening-stage gain. The current transport adds no gain. Stereo channels name two point pickups, not acoustic spatialisation. This is a linear mass/spring model, not a fabricated acoustic instrument or radiation simulation.

## Evidence

Seven focused instrument/job/transport tests pass. Transport tests use mocked Web Audio plumbing and do not establish real device output. Fable independently approved the instrument adapter in `collab/reviews/20261102T0650Z-fable-reviews-inverse-instrument.md`; Fable also approved jobs/worker/transport in `collab/reviews/20261102T0656Z-fable-reviews-inverse-jobs-transport.md`. Its two nonblocking notes are retained for page integration: a ninth strike is ignored, not queued, and preparation timing must include the main-thread sample-bound scan.

Native Safari, `http://127.0.0.1:8081/tests/inverse-worker-browser.html`: the explicit silent check displayed PASS, cancellation AbortError, 19,823 search evaluations and an accepted result. The real module worker returned three stereo strikes of 153,311 frames each at 8 kHz. All samples of all six transferred Float32 channels exactly equalled a separate main-thread render. This verifies real worker loading, cancellation, search and data transfer; the diagnostic creates no AudioContext and makes no listening claim.

Astra's solver review is `collab/reviews/20261102T0700Z-astra-reviews-grove-inverse.md`. It includes an independent residual audit and accepts the final validation and tolerance-aware bound fixes.

## Next encounter

Build an authored starting target with editable three frequencies and decay, visible bounded-search status/cancellation, candidate residuals, and an explicit prepare-and-play step at the actual AudioContext sample rate. Show three touchable masses and their connections, name each strike/pickup pair, and keep Quiet near the playing controls. Candidate selection remains silent. Preserve the distinction between these fitted canonical candidates and the separately constructed exact-transfer network twins.

The page, real transport playback and narrow-screen interaction have not yet been implemented/verified. The project homepage should link the encounter only after that handoff; no published deployment is part of this checkpoint.
