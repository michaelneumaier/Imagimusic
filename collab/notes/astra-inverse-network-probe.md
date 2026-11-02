# One measured response, several possible networks

2026-11-02, Astra. Run `node tools/probe-inverse-network.mjs`. The generated report is `renders/inverse-network-probe/report.json`; no browser or sound output is started.

## Why this experiment

Michael's starting idea asks for invented physical bodies for electronic sounds. A useful design tool must distinguish matching a particular observation from recovering the whole instrument. Reading the current beam model showed that dimension/material changes can preserve its entire normalized-strike response: its modal ratios and normalized shapes are fixed, width cancels, and the frequency scale depends only on thickness × sqrt(E/rho) / length². That makes an honest ambiguity illustration, but not two differently responding instruments in the current model.

The existing three-mass spring network offers a stronger, concrete example. Two different admitted networks reproduce the same complete response at one collocated strike/pickup, but respond differently to a strike elsewhere. This is a constructive witness using a known matrix, **not a solver recovering parameters from audio**.

## Construction and verification

The source has three equal 0.02 kg masses, grounded uncoupled frequencies 220/222/225 Hz, bridges 500/300/400 N/m, and mass-proportional damping gamma=0.7 per second. Its existing `coupledNetwork` implementation provides mass-normalized stiffness A, modal poles and closed-form impulse responses.

Choose an orthogonal Q that fixes coordinate 1 and rotates coordinates 2–3. Set A′ = Q A Qᵀ. The first row of Q is e₁ᵀ. Since Q leaves the first coordinate unchanged, the first-coordinate matrix function and thus its collocated impulse response are unchanged. Equal masses and the same gamma are held here. Reconstruct nonnegative bridge springs from the negative off-diagonal entries and positive grounded springs from the remaining diagonal stiffness. Reject a construction that needs a negative bridge or a nonpositive ground spring; an arbitrary rotation is not necessarily a member of this physical family.

The script uses a 0.01 N·s impulse, one source-derived displacement pickup scale shared by every candidate, and 24,000 samples over three seconds at 8 kHz. Body numbering is one-based in this prose and zero-based in the report. The target is strike body 1 → pickup body 1. The withheld gesture is strike body 2 → the same pickup. No candidate-specific loudness normalization is used.

| Rotation | Admitted | Target relative RMS error | Withheld relative RMS difference | Withheld residual after best scalar gain |
| --- | --- | --- | --- | --- |
| −30° | No: negative bridge | — | — | — |
| −20° | Yes | 4.46 × 10⁻¹³ | 0.0890 | 0.0449 |
| +30° | Yes | 8.10 × 10⁻¹³ | 0.3389 | 0.1051 |

The best-gain diagnostic is separate from the shared-scale comparison; it shows these withheld differences are not solely a scalar level change. It is not applied to the main traces. The script also asserts matched poles and collocated modal residues, checks eigensolver quality, and rejects the negative-bridge example. Repeating the run produces byte-identical JSON. The physical engine is unchanged. Fable independently reconstructed the matrices and reproduced the pole and waveform results (message 20261102T063229Z); the exact tool was then approved in collab/reviews/20261102T0635Z-fable-reviews-inverse-network-probe.md.

## What this does and does not establish

This is a passive, grounded lumped mass-spring system with positive parameters and common proportional damping. Admission here means coupledNetwork admission, not canonical Grove admission: the Grove additionally fixes body 1 at a permitted musical base and imposes a bridge-coupling floor. The 220 Hz source is not one of its permitted bases, and the −20° network also falls below its coupling floor. It supplies no acoustic geometry, radiation, microphone, material-identification or listening-quality evidence. The numerical samples agree within tolerance, not bit-for-bit. The orthogonal construction uses the full source matrix; it must never be described as learning anatomy from the single target trace.

The next design-search question is separate: can bounded candidates match three declared resonances and a decay? Those fitted quantities are not a whole sound. Candidate gestures and their pickup waveforms should be exposed after the fit, with failed searches and excluded quantities visible. Fable owns that bounded solver assessment/implementation; this witness remains an independent check on how we describe ambiguity.
