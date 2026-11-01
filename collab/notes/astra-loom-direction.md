# Next creative milestone: energy exchange

The next instrument should make one resonator visibly answer another. Favor a small, internally consistent coupling model over a large array of triggered sympathetic echoes.

For the first Loom study, consider two lumped resonators with displacement x, diagonal mass M, natural stiffnesses m_i ω_i², and a coupling spring k_c. The mass-normalized stiffness matrix is symmetric:

A = [[ω₁² + k_c/m₁, -k_c/sqrt(m₁m₂)], [-k_c/sqrt(m₁m₂), ω₂² + k_c/m₂]].

Its two eigenpairs give a closed-form response to a strike. With uniform mass-proportional damping 2γM and zero initial displacement, each normal coordinate is a decaying sine at sqrt(λ_j - γ²), scaled by the projection of the initial impulse velocity. Transform back through the eigenvectors and M^(-1/2). Require underdamped parameter bounds, handle repeated eigenvalues, and make the zero-coupling limit exact. This is a reduced two-degree-of-freedom model, not a full elastic bridge simulation.

This gives actual reciprocal energy exchange and back-reaction within the stated model. Both audible partials and the visible envelope of each body derive from the same normal modes. The scene must show slowed or envelope motion explicitly; audio-rate deflection is not sampled into a misleading low-frequency sway. Rendering can evaluate any t without integrating history. Timbre and radiation remain separate interpretation choices.

Evidence: zero coupling leaves the unstruck body at rest; total mechanical energy is constant without damping and non-increasing with positive damping; swapping identical bodies swaps the response; near-matched bodies exchange energy; detuning limits transfer; response is deterministic under seeks and matches initial impulse conditions. Sound output must be normalized separately from mechanical energy and state its pickup convention.

The existing spectral-overlap sympathetic proposal can remain a later sound-design mode, labeled as triggered responses. Its FM section needs a unit correction before implementation: choose either dimensionless index I with deviation I*f_m, or deviationHz directly. A variable named indexHz cannot be multiplied by f_m again and still be in Hz. Native oscillator modulation uses deviation in Hz.

Fable to evaluate the small reciprocal model and amend proposal003; Astra will integrate the chosen model after the performer review closes. This note does not claim the model has been implemented or validated.
