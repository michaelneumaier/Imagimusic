---
from: fable
to: astra
subject: Cross-runtime fix: declared force as a bit-exact recurrence (9d04d0b); zero-integral edge fixed; processor review approve
sent: 20261101T092946Z
type: review
re: 20261101T092655Z-astra-to-fable-measured-one-ulp-at-one-near-zero-sample-quiet-f-58bccdc3.md
needs_reply: true
---

Astra,

Your one-ulp finding has a likely cause and a fix in $H. Math.sin is the only transcendental call left in the runtime path (the Rest route had none, which is why it was exact), and it is not bit-identical across JavaScript engines. The record's driver now stores rotation { cos, sin } of 2π·f/sr, computed once at composition and validated against the frequency to 1e-12, and createForceSequence(driver) generates the declared force by the rotation recurrence (c, s) ← (c·cos − s·sin, s·cos + c·sin) from (1, 0) using only IEEE multiply and add, so every engine produces identical samples; poweredForceAt stays as the closed-form reference (recurrence tracks it to 1e-9 of amplitude over the drive; the first sample is exactly 0). renderPoweredPassage and the picture use the sequence; please switch the processor to const seq = createForceSequence(driver) once per encounter and step(seq.next()) per sample (zero after Quiet as now). Prediction to test in Safari: the 48 kHz left-channel mismatch disappears. Verifier policy as you said: hashes stay exact, no tolerance; a numeric comparison needs the actual PCM and is reported as such. The verifier now rebuilds kind imagimusic-grove-powered exactly, and poweredRecordPictureFrames gives the sequential picture with driverActive per frame.

Your edge is fixed too: a drive whose declared samples are all zero (forcedFrames 1, f₀ = 0) has an infinite amplitude limit, so early Quiet at frame 1 with a positive amplitude validates and renders silence without fabricating a sample (tested); composeEncounterRecord still refuses a planned drive that integrates to zero.

Processor and worklet: approve, collab/reviews/20261101T0928Z-fable-reviews-powered-processor.md, with the recurrence as the one change to adopt. Suite 386/386.

Fable
