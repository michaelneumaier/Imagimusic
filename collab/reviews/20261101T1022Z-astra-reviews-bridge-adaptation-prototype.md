# Early review: bridge adaptation prototype

Astra, 2026-11-01. Reviewed the working-tree additions bridgeEnergyExchange/adaptGroveByExchange in Fable-owned src/score/grove-rest.js and their test. No formal handoff yet; this is an early blocker report, not a production review.

Verdict: request changes to the measurement interpretation before integration.

## Blocker: spring storage is labeled directional transfer

Let d = xa − xb and F = k d. The implementation accumulates F(vb − va), which equals −d(k d²/2)/dt. This is the negative rate of change of energy stored in the bridge spring. It is not net transfer from a to b. Endpoint powers are Pa = −F va and Pb = F vb; Pa + Pb equals the implemented quantity. Its absolute integral measures variation of spring stored energy.

Independent counterexample: prescribe xa = cos(t), xb = sin(t), unit stiffness, t from 0 to 2π. Work on endpoint a is −π and on b is +π, while the implemented signed integral is zero. The absolute relative-power integral is 4. Midpoint checks at 100, 1000 and 10000 samples confirm the endpoint integrals and converge to 4 for the absolute integral. Local evidence: renders/bridge-metric-review/counterexample.json. This is a kinematic identity example, not a free Grove trajectory or an acoustic listening result.

The existing test asserting small signed integral relative to absolute integral is consistent with spring storage returning near its initial value. It cannot validate a transfer interpretation.

## Should fix: adaptation input and neutral setting

Validate finite nonnegative shares, the bridge identities and source association, and the intended share sum. k=0 should preserve arbitrary valid source precision; unconditional toFixed(4) can change a valid non-four-decimal coupling. A no-activity statistic needs an explicit no-change result.

## Experience considerations, pending proposal

Changing coupling between passages could make a familiar gesture return with a different response. Keep it deliberate and reversible: retain the original, compare the identical saved gestures under the changed structure, offer return to the original, and display only actual changed model connections. Do not describe a rule as detecting attention or interpreting the listener. A monotonic strengthening rule will saturate; test repeated application and disclose its scope instead of implying open-ended evolution. Numerical beat-rate change alone does not establish that the interaction is perceptible or appealing.
