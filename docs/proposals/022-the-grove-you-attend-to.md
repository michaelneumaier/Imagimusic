# Proposal 022: The grove you attend to

*Fable, 2026-11-01, answering Astra's request for one meaningful experiment reconnecting initial-idea's procedural invented bodies with Michael's attention/psychedelia direction, with a perceptible causal difference rather than explanatory UI. Measured prototype in the recipe layer; no runtime ownership changes; Astra's early review corrected the physics (see "The statistic").*

## The idea
Between passages, and only between them, the grove changes by a declared, bounded rule driven by what the player actually did: the bridges that moved the most energy in the last passage grow a little stiffer. The instrument is still an ordinary grove from the same generator's parameter space (couplings stay within `GROVE_BOUNDS`), every passage is still an exact linear render on its own canonical grove, and the Original grove is always one choice away. What a player attends to, in the plain sense of where their gestures sent energy, becomes audible in how the grove answers next time: beating rates and neighbour shares shift. That is the whole experiential claim; nothing about memory, learning or life is asserted.

## The statistic
`bridgeEnergyExchange(record, recipe)` measures, per bridge, from the state: the work the bridge does on each body (P_a = −F·ẋ_a, P_b = F·ẋ_b with F = kc·(x_a − x_b) at the attachments), the negative of their sum as the spring's storage change, a symmetric transfer estimate a → b, and **activity** = ∫(|P_a| + |P_b|), the energy moved in or out of the two bodies through the bridge including the spring's storage cycling. Astra's review caught the first draft's error (F·(ẋ_b − ẋ_a) is storage change, not transfer; a unit-spring full cycle gives endpoint work ∓π while that quantity integrates to zero); the endpoint-power form is what is implemented, with trapezoid quadrature over each continuous interval from the post-event state at a frame to the pre-event state at the next (an impulse does no bridge work), the quadrature residual measured and its convergence tested, and the exchange bound to the canonical grove it was measured on (the guard is mandatory). Shares are of activity.

## The rule
`adaptGroveByExchange(grove, exchange, { k = 0.5 })`: coupling_e ← clamp(coupling_e · (1 + k·share_e)) within the generator's bounds, rounded to the generator's precision; k = 0 or all-zero shares return the exact source; inputs validated (finite shares summing to at most 1, couplings and canonical grove identity matching). Repeated application saturates at the bound, by design; a session rule, reset on reload, never applied during a passage.

## Measured on the Rest invitation (seed 3, 8 kHz)
Activity shares differ by bridge (the 1–3 bridge carries most); one application with k = 0.5 changes the low-mode beat rates measurably (tested), bodies and tunings unchanged.

## Testable interaction (Astra owns the surface)
After Quiet on the Grove or Rest: an explicit compare choice, never automatic growth on Quiet (Astra's scope decision): one line of fact worded as what the statistic is, "this connection was most active in the model" (activity includes the spring's storage cycling and is not an allocation of the player's input energy, so "moved most of what you played" is not used), and a choice, Original or the grove you attend to, for the next passage; the same gestures can be heard on both through the strict variant adapter at canonical gain. Evaluation: render the greeting on the original and on the adapted grove after three passages that favour one bridge; measure the table (`describeIndividuality`); then Michael listens and says whether the change is audible and whether it feels like the instrument answering their playing. Numerical mode differences never stand in for that answer.

## Limits, explicit
Linear model, viscous contacts, three bodies, couplings only; the rule is artistic and declared; no claim of perception or appeal; saturation is measurable; the adapted grove must always be reproducible from the base seed plus the records that shaped it (the record carries its canonical grove, so verifiers are unchanged).
