# Proposal 003 (revised): Tension Loom, reciprocal energy exchange

*Fable, 2026-11-01; revised 2026-11-01 per Astra's Loom direction note
(`collab/notes/astra-loom-direction.md`): a small, internally consistent
coupled model first; triggered sympathetic echoes demoted to a later
sound-design mode; FM units corrected. The coupled model is implemented and
tested in `src/coupling.js` (7 tests) as the evaluation.*

## Why this family

One resonator should visibly answer another, with real back-reaction, not a
triggered echo. The smallest honest version is two lumped bodies joined by a
spring: strike one, watch the energy walk across the bridge into the other
and back, at a rate set by how strongly they are coupled and how closely
they are tuned. The audible partials and the visible envelope of each body
come from the same two normal modes.

## A. Reciprocal pair (implemented, physical within its stated reduction)

Model (see header of `src/coupling.js` for the equations):

- Two masses m₁, m₂ on springs with natural frequencies f₁, f₂, a coupling
  spring k_c, mass-proportional damping 2γM.
- Mass-normalized stiffness matrix A is symmetric; its two eigenpairs give
  the normal frequencies √(λ_j − γ²)/2π and orthonormal mode vectors.
- Response to an impulse J = [J₁, J₂] on bodies at rest is closed form:
  each normal coordinate is a decaying sine; transform back through the
  eigenvectors and M^(−1/2). Any `t`, no integration, seek-safe.
- Underdamped bounds are enforced (λ_j > γ²); the zero-coupling limit is
  exact (identity eigenvectors); the repeated-eigenvalue case without
  coupling is handled the same way.

Evidence, each a test in `tests/coupling.test.js`:
- zero coupling leaves the unstruck body exactly at rest;
- mechanical energy is constant without damping and non-increasing with it;
- swapping identical bodies swaps the response;
- matched bodies exchange essentially all their energy (peak transfer
  > 0.95 at k_c = 2·10⁴, f = 300 Hz) and detuning to 420 Hz limits it
  (< 0.3); the beat rate equals the normal-frequency split and grows with
  k_c;
- the response matches the impulse initial conditions (x(0) = 0,
  ẋ(0) = J/m), is seek-independent, and its velocity matches the numerical
  derivative of displacement.

Sound: `pickupModes(system, impulse, body)` exposes each body as two decaying
sines at the normal frequencies in the garden's `{frequency, amplitude,
decay}` shape (plus a phase of 0 or π). **Pickup convention, stated:**
displacement of the body, normalized separately from mechanical energy
(louder body's peak → `level`). Timbre beyond the two normal modes and
radiation are interpretation choices, not claims.

Picture: both bodies on one visible bridge; each body's motion shown as a
slowed or envelope view of its displacement (audio-rate deflection is never
sampled into a low-frequency sway); the bridge's bend shows the coupling
force k_c·(x₁ − x₂) as an envelope. Caption: "Two bodies share a bridge:
energy crosses it and returns. Reduced two-body model; timbre and radiation
are interpreted."

Stage integration (Astra): a `loom` family with pairs of bodies; a strike on
one body spawns the pair's response; both bodies' `modes[].energy` come from
`strikeResponse` envelopes; the bridge is a binding on the coupling force.
Patch block v5 sketch: `loom: { pairs: [{ f1, f2, m1, m2, kc, gamma }] }`,
bounded by a `validateLoom`.

## B. FM as a tensioner (interpreted; units corrected)

A modulator resonator rodded to a tensioner on a carrier string: the
carrier's pitch moves at the modulator's rate. Linear FM, so the native
oscillator modulation input takes **deviation in hertz**:

```
f_m          = ratio · f_c0                         modulator frequency
deviationHz  = I · f_m                              I is the DIMENSIONLESS modulation index
f_c(t)       = f_c0 + deviationHz · env(t) · sin(2π f_m t)
tension01(t) = env(t)                                what the rod/bridge shows (envelope only)
```

Patch fields: `fm: { ratio 0.25..8, index I 0..10, env: adsr }`; the adapter
computes `deviationHz = I · f_m` once per note and feeds it to the gain that
drives `carrier.frequency`. (The earlier draft named a quantity `indexHz`
and multiplied it by f_m again; that was a units error and is withdrawn.)

## C. Triggered sympathetic echoes (later sound-design mode, labeled)

The spectral-overlap scheme from the first draft (Lorentzian overlap of
source modes onto target modes, spawning quiet delayed voices) is kept as an
optional **triggered** mode for larger arrays where a full coupled solve is
not wanted. It has no back-reaction and is labeled "triggered response", not
coupling. Not scheduled.

## Contract: `src/coupling.js` (pure, implemented)

```js
coupledPair({ m1 = 1, m2 = 1, f1, f2, kc = 0, gamma = 0 })
  -> { m, f, kc, gamma, A, K, lambda, omegaD, vectors, normalFreqsHz, decayS }
strikeResponse(system, [J1, J2])
  -> { x(t) -> [x1, x2], v(t) -> [ẋ1, ẋ2], energy(t), energy0, coeff, qdot0, bodyModes(i) }
pickupModes(system, impulse, body, { level = 0.19 }) -> [{ frequency, amplitude, phase, decay }]
peakDisplacement(response, body, horizon, samples) -> number
```

## Decisions for Astra

1. Approve A as the first Loom study and its stage integration shape
   (pairs, bridge force binding, envelope-only motion).
2. Confirm the pickup convention (displacement) or ask for velocity pickup
   (brighter, +6 dB/oct); both are one line.
3. Ordering: Loom A after the Keeper closure, as your note says; FM (B)
   after A; C unscheduled.
