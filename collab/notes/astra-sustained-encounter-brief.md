# A sustained encounter — experiment brief, not a shipped feature

2026-11-01 · Astra · follows the first-use disclosure checkpoint e4411b4

## Experience question

Can supplying energy for a while, then releasing the instrument, make the transition from acting to listening more legible and musically useful? The existing Grove vocabulary supplies impulses; Rest adds a passive contact that changes what survives. Those already support discovery across bodies. Another instruction panel or unsolicited animated target would add little to that vocabulary.

Michael's spirituality/psychedelia direction can inform the relationship: sustained attention, a continuous action that affects several bodies, and a release whose outcome belongs to the instrument. No desired emotional state, consciousness claim, prescribed breathing, or borrowed spiritual iconography is needed. Whether the result is compelling remains a listening/playing question.

## A bounded candidate: a powered driver

Start with an offline study on an existing Grove, not a new public route. Apply a sinusoidal external force at one existing strike coordinate for two seconds, then remove the force and let the connected bodies ring for three seconds. Compare three explicitly labeled cases: force alone, the same force with a firm contact on the driven body, and the same force with that contact on a connected neighbor. Reuse the existing physical parameters, pickup placement and gain. Keep force history identical across these three cases.

This is an ideal powered driver, not a simulated bow, human hand, breath or electromagnetic actuator. A constant force would mainly produce an onset, static deflection and release, so it is not the candidate for sustained ringing. Frequency can initially be a fixed declared body tuning. Do not call it resonance tracking: that would be a separate feedback mechanism. No spontaneous answering notes or energy on release.

A later playable version, if the study warrants it, would make hold duration the principal control. A steady input mark can identify that the driver is active; the bodies' existing envelopes still come from model state. A slow decorative pulsation must not masquerade as the audio-rate force. Stopping or cancelling must remove the source independently of any render/UI state.

## Model boundary and candidate bound

The current `src/rest/engine.js` advances a passive state between impulses. Its `bound()` explicitly applies while only damping acts. Reusing that assumption unchanged for a continuous source would be incorrect.

In mass-normalized coordinates let q' = v and v' = -Kq - Cv + b f(t), with the existing positive stiffness and dissipative contact damping. The force direction b is the velocity part of an existing unit strike vector. Mechanical energy E = (vᵀv + qᵀKq)/2 then obeys

    E' = -vᵀCv + (vᵀb) f(t)
       ≤ sqrt(2E) ||b|| |f(t)|.

Consequently the candidate conservative budget is

    sqrt(2E(t)) ≤ sqrt(2E(0)) + ||b|| ∫₀ᵗ |f(s)| ds.

Combining this with the recipe's existing energy-to-pickup factor gives an output bound. This is a proposed derivation for peer review, not a newly proven runtime invariant. It assumes passive C, positive K and no unaccounted impulses. Multiple sources/strikes need their own explicitly accumulated budgets. With force zero, the existing passive bound applies again. The absolute-force integral is deliberately conservative; it does not measure actual injected work or perceptual loudness.

For an initial zero-state, finite-duration study, choose amplitude from a declared budget before rendering; do not boost/limit after rendering and imply the original model remained unchanged. Report both the predicted bound and observed sample peak, separately. Preserve force phase, envelope, frequency, location and duration in the experimental artifact; do not label it as an existing Rest record because that schema cannot reconstruct forcing.

One numerical option is exact affine evolution for each constant force interval: x_next = exp(Ah)x + integral(exp(As)b ds)f. A sampled sinusoid held constant over each sample is a defined piecewise-constant force, not an exact continuous sinusoid. A continuous sinusoid could instead be represented by an augmented oscillator state. Fable should choose and document one before implementation. Contacts change A, not the declared input force.

## Evaluation before live integration

- Zero force agrees with the existing passive engine; source removal leaves ordinary free/contact evolution.
- State stays continuous at force/contact boundaries. A time-step comparison must compare the same declared input, not two different sampled force histories.
- Numerical work/dissipation checks and the conservative budget cover the actual forced interval. Contacts can change local pickup amplitude without creating total mechanical energy.
- Render one reproducible study with source/units/numerical method stated, three WAVs, force timeline, model parameters and quantitative report. Existing film/Rest verifier must not silently accept this new format.
- Listening question: is the build-and-release contrast audible and worth playing? Does the neighbor contact offer an intelligible alternative? Numerical evidence cannot answer either question. No production integration or claim of appeal follows merely from a passing solver check.

## Immediate small improvement

The optional Rest guide's first accepted strike currently replaces its prompt with “Strike … again.” Leave room to listen by saying “Let it ring. When you are ready…” before the next gesture. Preserve acknowledgement-based state progression; do not add a timer, automatic strike, score, or claimed listening detection. This wording remains Fable-owned in the model's prompt helper.
