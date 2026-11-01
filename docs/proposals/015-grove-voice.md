# Proposal 015: A richer voice for the Grove, bodies with partials coupled through their bridges

*Fable, 2026-11-01, at Astra's request after the Grove checkpoint: the
three near-unison lumped modes demonstrate relationship but are timbrally
sparse. This proposes a restrained family of higher modes per body with
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

**Damping, stated honestly.** The pair and the grove use one proportional
damping `2γM`, which keeps the modes real. Material loss factors differ
per partial (higher partials die faster), and that is much of what makes
a voice "material". Per-mode damping is not proportional in general, so
the proposal uses the standard classical-damping approximation: assign
each **coupled** normal mode a decay from the material loss factors of
the body partials it is made of (participation-weighted), after
diagonalizing the undamped system. This is an approximation, named as
such in the docs and the caption ("partials fade at material rates,
assigned per mode"), and its error is measurable: the undamped eigen
problem is exact; only the decay assignment is approximate.

## What stays intimate

- `M = 1` with the attachment at the beam tip reproduces today's grove
  **exactly** (same stiffness matrix, same modes); a test asserts it. The
  first gesture, one body alone and the others swelling, is the same
  gesture; it now has partials.
- Restraint: M ≤ 4, partial amplitudes falling with mode number by the
  beam's own shapes (no boosting), the network-wide pickup scale, the
  fixed gain, the same admission bound. Default strike position near the
  middle of the body (fundamental dominant); a page may later expose
  position as a second gesture axis.

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

and reports, from the rendered PCM and the modal data: number of partials
above −40 dB at 50 ms, spectral centroid over the first 0.5 s, each
partial's decay time, and the far bodies' first swell time and ratio (to
show the relationship is unchanged in kind). It writes both WAVs under
`renders/` for an A/B listen. The audition question is then concrete:
does the body sound like a thing with a material, and is the swell of the
others still the first thing you notice? Only if both are yes does the
page change.

## Scope and ownership

- 015a (Fable): `modalNetwork` in `src/coupling.js` (N bodies × M
  partials, attachment-point coupling, strike-position excitation,
  classical-damping decay assignment) with tests: M = 1 reproduces
  `coupledNetwork` exactly; EOM residual for the undamped part; symmetry;
  energy-free statements only; the beam family from `geometry.js`.
- 015b (Fable): the comparison tool and its report; `composeGrove` gains
  an optional `voice: { partials: M, strikeU, attachU }` block (default
  M = 1, so every existing grove, record and test is unchanged).
- 015c (Astra): page caption and model disclosure for partials and the
  damping approximation; strike position as an optional gesture axis;
  bands/visuals for partials if wanted.

## Not in scope

No nonlinear contact, no radiation, no shell acoustics, no claim that
the beam family is the sculpture's shape (the shells remain design).
