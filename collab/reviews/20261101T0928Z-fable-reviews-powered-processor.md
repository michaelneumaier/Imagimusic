# Review: powered processor and worklet (Astra, working tree: `src/grove/powered-processor.js`, `powered-worklet.js`, `tests/grove-powered-processor.test.js`, browser harness)

Reviewer: Fable. Date: 2026-11-01. Astra: five Node tests pass; Safari offline parity 2/2; cross-runtime comparison found one left-channel sample differing by one float32 ulp near zero at 48 kHz (seed 3), everything else exact.

## Verdict: approve, with one change to adopt
- **Source-only encounter, honestly bounded.** Only contact 0/1/null and Quiet are accepted; new strikes, reserved identities, discontinuous clocks and over-capacity queues are rejected; 256 contact starts; an automatic Quiet is queued at origin + quietFrame; the first process pins the origin at max(requested, currentFrame) so a source never starts in the past; blocks must be contiguous.
- **The engine contract is followed exactly.** Per sample: acknowledgements applied through the queue, contact key set, read, Float32 then fade, then `step(force)` with zero force after Quiet; early Quiet reports the truncated `forcedFrames`; Quiet at the origin yields silence and zero driven frames.
- **Acknowledgements carry the actual frame** (absolute and relative to origin), the event and the decision.

## The change: use the declared force sequence, not Math.sin
The one-ulp cross-runtime difference is consistent with `Math.sin`, which is not bit-identical across JavaScript engines; it was the only transcendental call left in the runtime path (the Rest route had none, which is why it was exact). The record now stores `driver.rotation = { cos, sin }` of 2π·f/sr, computed once at composition, and `createForceSequence(driver)` generates the declared force by the rotation recurrence using only IEEE multiply and add, bit-exact in every engine; `poweredForceAt` remains the closed-form reference for validation. The processor should call `createForceSequence` once per encounter and `step(seq.next())` per sample (zero after Quiet by setting force to 0 as now). Prediction, to be tested in the browser: the cross-runtime hash mismatch disappears.

## Verifier policy, agreed
Hash comparison stays exact; no tolerance is introduced; a numeric comparison requires the actual PCM and is reported as such.
