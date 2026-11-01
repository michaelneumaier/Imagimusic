# Proposal 015 (rev. 2): A richer voice for the Grove, bodies with partials coupled through their bridges

*Fable, 2026-11-01, at Astra's request after the Grove checkpoint; rev. 2
applies Astra's six corrections (060748Z) and records the 015a evidence.
The three near-unison lumped modes demonstrate relationship but are
timbrally sparse. This proposes a restrained family of higher modes per body with
strike position and material response, with real coupling, keeping the
intimate first gesture. Acoustic interpretation and a small measurable
listening comparison before any implementation.*

## The idea, physically

Today each grove body is one lumped mass on a spring: one degree of
freedom, one partial. A real struck body (a bar, a shell rim) has a series
of partials with their own shapes; where you strike decides which partials
speak, and a bridge attached at a point on the body couples every partial
that moves at that point. The honest generalization is therefore not "add
overtones to the sound" but **give each body a few modal coordinates and
let the bridge couple all of them through their mode shapes at the
attachment point**:

- Body `a` has modes `j = 1..M` (M = 3 or 4) with shapes `φ_aj(u)` along
  a normalized length `u ∈ [0, 1]`, natural frequencies `f_aj` and modal
  masses `m_aj`. `src/geometry.js` already provides clamped-free beam
  modes (frequencies, shapes, loss factors by material); the grove's body
  tuning sets `f_a1`, and the beam's ratios set `f_a2..M` (the
  "material/geometry" of the voice), stated as the beam family.
- Displacement at a point: `w_a(u) = Σ_j φ_aj(u) q_aj`.
- A bridge of stiffness `kc` attached at `u_a` on body `a` and `u_b` on
  body `b` adds potential `½ kc (w_a(u_a) − w_b(u_b))²`, i.e. stiffness
  blocks `kc · φ_a(u_a) φ_a(u_a)ᵀ`, `kc · φ_b(u_b) φ_b(u_b)ᵀ` and the
  cross block `−kc · φ_a(u_a) φ_b(u_b)ᵀ` over all modal coordinates.
- A strike at position `s` with impulse `J` on body `a` gives
  `q̇_aj(0) = J φ_aj(s) / m_aj`: strike position selects partials, as the
  garden's resonators already do.
- The whole system is `M ẍ + C ẋ + K x = 0` over `N·M` coordinates
  (≤ 15), symmetric, solved by the existing `symmetricEigen`; everything
  downstream (closed-form response, pickup modes, envelopes, bounds) is
  unchanged in kind.

**Damping, stated honestly and measured.** The pair and the grove use one
proportional damping `2γM`, which keeps the modes real. Per-partial decay
rates (constant loss factor ⇒ rate ∝ frequency, anchored to the grove's
loss for the fundamental) are not proportional in general, so 015a uses
the classical-damping approximation exactly as Astra specified: with
`D = diag(partial rates)` in mass-normalized coordinates, each coupled
mode gets `γ_r = v_rᵀ D v_r` and `ω_dr = √(λ_r − γ_r²)`, and the system
reports what it discards, `‖offdiag(V D Vᵀ)‖_F / ‖D‖_F`. Evidence
(tests/modal-network.test.js, a representative three-body voice with
three partials each, struck at u = 0.6): discarded damping 7.9e-5
relative; against a direct RK4 integration of `M q̈ + C q̇ + K q = 0` with
`C = diag(2 m γ)` over 0.6 s the closed form's discrepancy is 8.0e-5 at
h = 1/192000 and 5.0e-6 at h = 1/384000, falling ≈16× per halving, so the
integrator's own error dominates and the approximation error on this case
is below the finest-step discrepancy (≈ 5e-6 of peak displacement); the
reference-to-reference difference bounds the numerical error. This is a
discrepancy at a finite step, not a measured approximation error (Astra's
refinement). The undamped eigenproblem is exact.

## What stays intimate

- `M = 1` reproduces today's grove **exactly** under identical conventions
  (same modal mass, unit shape at attachment, strike and pickup, same
  loss): the test compares normal frequencies, displacement and velocity
  at ~180 sampled times and the pickup modes against `coupledNetwork`, to
  1e-12 relative. The first gesture, one body alone and the others
  swelling, is the same gesture; it may now have partials.
- Restraint: M ≤ 4, no boosting, the network-wide pickup scale, the fixed
  gain, the same admission bound. Which partials a middle strike actually
  favors is **measured** from the displacement pickup (mode shapes alone
  promise nothing about amplitude ordering); the A/B decides. Striking at
  a node of a partial leaves it almost silent (tested), which is what
  "strike position selects partials" means here.
- **Picture:** the all-band envelope beats at audio rates with partials
  present and must not drive the shell animation. The relationship
  readout for the scene stays separately defined on the low band (the
  fundamental-dominated modes), or a bounded temporal RMS with a stated
  window; Astra maps it after the contract.
- **Records:** `composeGrove`'s v1 canonical schema is unchanged; the
  comparison wraps a grove with a separate voice configuration. Any
  schema evolution follows the audition, never a silent change to v1.

## Acoustic interpretation (what we claim and what we do not)

| Claim | Status |
| --- | --- |
| Partials and their ratios | from the clamped-free beam family in `geometry.js`, physical mode |
| Strike position selecting partials | physical (mode shapes at the strike point) |
| Bridge coupling all partials through attachment-point shapes | physical, linear |
| Per-mode decay from material loss factors | classical-damping **approximation**, stated |
| Shell appearance, suspension, materials | design, as today |
| Radiation, room, nonlinearity | absent, as today |

## The measurable listening comparison (before implementation of the page)

A Node tool (`tools/grove-voice-compare.mjs`, Fable) renders, for each
curated seed, body 0 struck alone at the default position:

1. the current grove (M = 1), and
2. the proposed voice (M = 3, beam ratios, classical damping),

at **equal reference force and pickup scale**, and reports from the
rendered PCM and the modal data: peak and RMS (so the comparison is not
louder vs quieter), number of partials above −40 dB at 50 ms, spectral
centroid over the first 0.5 s, each partial's decay time, and the far
bodies' first swell time and ratio on the low band (to show the
relationship unchanged in kind). It writes both WAVs under `renders/` for
an A/B listen. Reports quantify; no claim that the audition succeeded
unless someone has actually listened. The audition question is then concrete:
does the body sound like a thing with a material, and is the swell of the
others still the first thing you notice? Only if both are yes does the
page change.

## Scope and ownership

- 015a (Fable), landed: `modalNetwork` in `src/coupling.js` (N bodies × M
  partials, attachment-point coupling, strike-position excitation,
  classical-damping decay with the discarded part reported) with tests:
  M = 1 reproduces `coupledNetwork` on x, v and pickup modes; undamped
  EOM residual; node-strike silences a partial; assigned decays within the
  partial range; direct damped ODE comparison; validation. The beam family
  comes from `geometry.js` (clamped-free ratios and shapes).
- 015b (Fable): the comparison tool and its report; a separate voice
  configuration `{ partials: M, strikeU, attachU, pickupU }` wraps a v1
  grove for the comparison. `composeGrove`'s v1 schema is unchanged; any
  schema evolution follows the audition.
- 015c (Astra): page caption and model disclosure for partials and the
  damping approximation; strike position as an optional gesture axis;
  bands/visuals for partials if wanted.

## Not in scope

No nonlinear contact, no radiation, no shell acoustics, no claim that
the beam family is the sculpture's shape (the shells remain design).
