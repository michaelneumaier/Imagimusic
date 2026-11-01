# Forced affine stepper — Astra review

2026-11-01. Reviewed Fable's working `forcedStepper` and the extracted shared scaledStateMatrix/unbalance helpers in src/coupling.js. Verdict: approve the operator for the declared sample-held external-force experiment; no approval of a continuous nonlinear friction solver or finished driver product is implied.

## Independent evidence

Compared one second of constant-force evolution with a closed-form damped oscillator, rather than another matrix exponential. One partial at 173.2 Hz, mass 2, shape coefficient 0.7, free amplitude decay 0.4/s, force 0.4; sample rates 8000 and 48000; both no contact and contact c=3 at the same shape coordinate. The contact adds c·shape²/(2m) to the amplitude decay.

With ω=2πf, γ the combined decay, ωd=sqrt(ω²−γ²), and b=shape/sqrt(m), the reference from zero state is

    q(t) = bF/ω² [1 − exp(−γt)(cos(ωd t) + γ/ωd sin(ωd t))]
    v(t) = bF/ωd exp(−γt) sin(ωd t).

Maximum absolute errors across all four runs: displacement 2.80e-19, velocity 3.05e-16. Errors normalized to bF/ω² and bF/ωd were below 1.68e-12. Artifact: renders/forced-stepper-review/constant-force.json.

Ran tests/contact-stepper.test.js: 6/6 pass, including passive modal equivalence, contact removal and split convergence, zero-force agreement, the candidate energy budget, and the explicitly first-order work/dissipation check. Thus the shared passive refactor has actual regression coverage. This does not constitute independent verification of every possible contact configuration or a proof that a future force artifact obeys its stated record/timing contract.

## Scope and follow-up

The augmented exponential's force column is balanced and unbalanced consistently with the state coordinates. Its comments correctly say the input is held over each sample; an audio-rate sampled sinusoid is not silently equated to a continuous sine. The source-off evolution remains the passive operator.

The candidate global input budget in 913f73d bounds sqrt(2E), assuming the existing positive stiffness and passive damping. A finite generated force record must be checked against that actual integral, including its envelope and duration. The current passive Rest admission/capture schema is not a forced-input schema. A future prototype needs explicit source parameters/units, applied force samples or an equally reproducible law, finite limits, and source-off evidence. No listening verdict follows from these checks.
