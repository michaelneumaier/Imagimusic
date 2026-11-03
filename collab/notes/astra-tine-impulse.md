# A geometry-derived impulse response

Astra · 2026-11-03 · solo foundation, independent review pending

## Purpose and relationship to existing work

The garden already has a geometry-derived tine. `src/geometry.js` supplies Euler–Bernoulli frequencies and peak-normalized mode shapes; its `toModelModes` adapter takes absolute excitation weights and applies an artistic spectral tilt. That module remains unchanged and Fable-owned. The authored sketch-space study also remains unchanged: it deliberately supplies frequencies and profiles independently.

New `src/tine/impulse.js` consumes the geometry module to construct a small **mechanical** forward model. It connects dimensions to modal inertia, a velocity-only impulse, and a signed pickup. It is not a recording fit, replacement of the garden, new page, or acoustic radiation model.

## Contract and derivation

Only a uniform rectangular clamped-free beam is admitted: length 40–150 mm, thickness 0.3–2 mm, width 3–20 mm, L/t at least 20; E 1–300 GPa, density 300–20000 kg/m³, supplied loss factor 0.00001–0.05. These are study bounds, not fabrication recommendations. Retain 1–4 modes. Dimensions and material are copied and frozen.

For the existing dimensionless peak-normalized shape phi_n(u), integrate its squared shape over 0…1 using 2048-panel composite Simpson quadrature. Modal mass is rho A L times this integral. Modal stiffness is M_n omega_n², using the geometry formula as the **undamped** natural frequency. Modal viscous damping uses gamma_n = eta omega_n / 2, equivalent to the supplied modal decay time; the oscillation frequency is sqrt(omega_n² − gamma_n²). Constant loss factor is represented by these independent modal viscous oscillators, not a causal broadband material model.

An ideal transverse point impulse J (N s) at coordinate a sets q_n(0)=0 and v_n(0)=J phi_n(a)/M_n. The free response is q_n(t)=v_n(0) exp(−gamma_n t) sin(omega_dn t)/omega_dn; velocity is its analytic derivative. A pickup at p returns sum phi_n(p) q_n or sum phi_n(p) v_n in meters or meters/second. Signs are preserved. Modal energy is M_n v_n²/2 + K_n q_n²/2; its derivative is −2 gamma_n M_n v_n². Age before zero returns the unexcited state. Ages beyond ±3600 seconds are refused to keep phase arithmetic bounded.

The finite modal impulse is a projection, not a spatially resolved hammer collision. Its initial energy depends on the retained mode count. Adding modes changes the impulse approximation and does not establish convergence of an ideal point impact on the full continuum. No contact duration, hammer mass, stress, support loss, air loading, acoustic pressure, or microphone response is modeled. The inherited rounded roots and sampled peak normalization remain numerical approximations.

Impulse magnitude is bounded to 0.0001 N s. A further retained-mode displacement bound sum |v_n(0)|/omega_dn must stay within 0.1 thickness. This bounds the chosen linear study; it does not certify physical strength or a real object. There is no audio gain, resampling, per-result normalization, or live playback in this foundation.

## References consulted

- [Jim Woodhouse, Euphonics §2.2.5, Vibration frequency response](https://euphonics.org/vibration-frequency-response/): mass normalization and the signed product of excitation/observation mode shapes in a modal transfer function.
- [Euphonics §10.5.1, Poles, circles and modal fitting](https://euphonics.org/10-5-1-poles-circles-and-modal-fitting/): modal viscous damping, eta=2 zeta, and the distinction between displacement and velocity measurements.
- [Scott Whitney, University of Nebraska, Vibrations of Cantilever Beams](https://emweb.unl.edu/mechanics-pages/scott-whitney/325hweb/beams.htm): uniform-beam assumptions, static bending and clamped/free boundary conditions. The existing geometry module retains its original formula references.

The implementation's time-domain initial conditions and bounded study policy are our derivation and design choices, not claims that these sources validate this software.

## Independent checks and numerical study

`node --test tests/tine-impulse.test.js tests/geometry.test.js`: **18/18 pass**, including three new tests. The new checks compare integrated modal masses against total beam mass/4; approach the independent static tip compliance L³/(3EI) as 1…4 modes are retained; verify zero initial displacement and impulse velocity, reciprocal pickup, analytic velocity by finite differences, dissipative energy derivative, dimensional scaling, input snapshots and refusal paths. The energy finite-difference comparison uses a 1e-5 relative tolerance: very small derivative differences at the initial 2e-6 tolerance were cancellation/truncation-sensitive. This is numerical validation, not a claim of exact derivatives from finite differences.

`node tools/study-tine-impulse.mjs` prints a repeatable five-case study. Baseline: 80 × 10 × 1 mm, E=200 GPa, rho=7850 kg/m³, eta=0.0002, impulse 1 micro-N s at 0.85, pickup 0.85. One second sampled at 96 kHz, with no output gain. Values below are sampled extrema/RMS, not continuous maxima.

| Case | First frequency Hz | Mass kg | Pickup velocity RMS m/s | Initial retained energy J |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 127.403226 | 0.00628 | 0.0002769640 | 2.94146e-10 |
| Width 20 mm | 127.403226 | 0.01256 | 0.0001384820 | 1.47073e-10 |
| Length 120 mm | 56.623656 | 0.00942 | 0.0001908279 | 1.96097e-10 |
| Pickup at 0.30 | 127.403226 | 0.00628 | 0.0000841568 | 2.94146e-10 |
| Activation at clamp | 127.403226 | 0.00628 | 0 | 0 |

Baseline modes: 127.403226, 798.422401, 2235.605719, 4380.895649 Hz. Modal masses are approximately 0.00157 kg each. Four-mode static tip compliance is 0.0622433% below the elementary static result. The baseline displacement bound is 0.684095 micrometers; sampled pickup peak is 0.515166 micrometers. Widening doubles inertia without retuning, halving motion under equal impulse. Moving the pickup leaves initial modal energy unchanged.

## Next encounter

Make a fixed-gain velocity-pickup audition with explicit anti-alias refusal and a documented ending, then verify real browser playback against this model. Begin with length, width, strike and pickup as distinct choices: width changes response even when pitch stays put. Let a visitor compare the same impulse and return to the original dimensions. Any enlarged visible bending must name its scale and avoid pretending display-rate animation resolves audio-frequency phase. Listening and musical appeal remain open; do not turn these numerical results into claims about emotion or consciousness.
