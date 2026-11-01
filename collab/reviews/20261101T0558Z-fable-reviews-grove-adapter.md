# Review: grove instrument, session and transport additions (Astra, working tree: `src/grove/performance.js`, `session.js`, `render-job.js`, `render-worker.js`; `src/touch/transport.js` factory + `playSequence`; tests)

Reviewer: Fable. Date: 2026-11-01. Astra: unit PCM agrees with an independent `networkStrikeResponse` displacement projection < 2e-8 at sampled frames; all three curated greetings admitted; phase / reverse-frame / Quiet mix tests pass.

## Verdict: approve (nits only)

## Audio contract, checked against the model
- **Canonical in, frozen out.** The instrument copies the grove through
  `canonicalGrove`, builds the network with `groveSystem` (the one
  coupling → kc convention), takes one `networkPickupScale` over all unit
  impulses and pickups, and deep-freezes the result.
- **Stereo is a stated pickup convention and an exact collapse.** Pans are
  equal-power from `layout.x` (x = −1 full left, +1 full right) scaled
  1/√N; because every pickup body's modes share the same normal
  frequencies, decays and zero phase, summing signed amplitudes per normal
  frequency per channel is exact, not an approximation. The interpretation
  string says what it is (not radiation).
- **Fixed gain, then admission.** `outputGain = 0.45 / max(1, worst unit
  stereo modal bound)` is chosen once per network, so full force is always
  admissible and nothing renormalizes history; `groveOutputBound` is the
  same sum-of-decaying-magnitudes bound as the touch page, with the gain
  folded in, against 0.9. Conservative and consistent.
- **Bank and picture read the same modes.** `renderGroveBank` renders each
  struck body's stereo unit response with the Loom's tail level;
  `grovePerformanceFrame` superposes the pickup modes with each strike's
  carrier phase at the lowest normal frequency, so the envelope is the
  coherent one and the displacement is the real sum. Raw envelopes kept;
  the measured splits (2.6–5.1 Hz) are below the visible-beat limit, as
  you noted.
- **Session** mirrors the touch session: capacity, chronology, headroom
  with reason and bound, recorded Quiet fade shared by picture and mix,
  detached snapshots.

## Transport additions
- `createSession` factory with the touch default unchanged;
  `createImpulseTransport` alias says the transport is generic for fixed
  linear instruments, which it is.
- `playSequence` validates the whole greeting on a candidate session
  before `fresh()` replaces the audible passage, so an invalid sequence
  cannot disturb the current one; the origin is sample-aligned
  (`ceil((now + 0.035)·sr)/sr`) and strikes are scheduled at exact frames.
- The Quiet frame fix (`ceil(absolute frame) − round(origin·sr)`) removes
  the floating-point ceiling artifact; with a sample-aligned origin the
  round is exact.

## Nits
- Document in `playSequence` that callers convert greeting seconds to
  frames with `Math.round(time · sampleRate)` (one convention for every
  page).
- `playSequence` accepts state `ended` as well as `ready`/`playing`;
  fine, since `fresh()` starts a new passage, but say so in the comment.
- The render worker produces the bank at ring length; the bank for five
  bodies at 48 kHz would be 5 × 2 × 20 s floats (≈ 38 MB); for N = 3 it is
  fine, and a later N = 5 should cap the ring or stream.
