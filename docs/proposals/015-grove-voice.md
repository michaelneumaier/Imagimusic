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
`C = diag(2 m γ)` over 0.6 s the observed discrepancy is 8.0e-5 at h = 1/192000 and 5.0e-6
at h = 1/384000, falling ≈16× per halving as RK4's own convergence
predicts: evidence that the integrator dominates what is observed, not a
rigorous bound on the approximation error (errors can cancel; Astra's
correction). The thresholds in the test are empirical checks. The
undamped eigenproblem is exact.

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

## The comparison, measured (015b, `tools/grove-voice-compare.mjs`)

Unit strike on body 0 at u = 0.6, attachments and pickups at the tip,
M = 3 beam partials (decay rates ∝ frequency anchored to the grove loss),
equal reference force, 48 kHz. The pickup level, pan and gain follow the
same **rules** for both voices (the 0.19 level mapped to the largest modal
amplitude over all unit strikes and pickups; the gain from the worst unit
stereo bound over every struck body and channel), which does not make the
physical pickup gains identical: each voice's `pickupScale` is reported
(seed 3: 5.22 for M = 1, 11.31 for M = 3; the output gain is 0.45 for both
because neither bound exceeds 1). The "modal centroid estimate" weights
normal-mode frequencies by each mode's envelope energy over the first
0.5 s and ignores cross terms between nearby modes; it is not a PCM
spectral centroid. `renders/grove-voice-<seed>-m1.wav` and `-m3.wav` for the
A/B; `renders/grove-voice-report.json` for the numbers.

| Seed | Voice | Normal modes (Hz) | Partials > −40 dB at 50 ms | Modal centroid estimate (first 0.5 s) | Peak (full render) / RMS (first s) | Low-band swells (body: s × ratio) |
| --- | --- | --- | --- | --- | --- | --- |
| 3 | M = 1 | 128.7 / 131.2 / 132.2 | 3 | 131.6 Hz | 0.0565 / 0.0267 | 1: 0.222 × 0.175; 2: 0.436 × 0.804 |
| 3 | M = 3 | the same three, + 804 / 819 / 820, + 2251 / 2293 / 2295 | 5 | 157.9 Hz | 0.0613 / 0.0269 | 1: 0.222 × 0.175; 2: 0.438 × 0.804 |
| 7 | M = 1 | 130.7 / 131.1 / 133.3 | 3 | 131.1 Hz | 0.0362 / 0.0140 | 1: 0.200 × 0.358; 2: 0.360 × 0.251 |
| 7 | M = 3 | + 816 / 820 / 828, + 2285 / 2295 / 2317 | 5 | 143.8 Hz | 0.0423 / 0.0141 | 1: 0.200 × 0.358; 2: 0.360 × 0.251 |
| 11 | M = 1 | 196.4 / 198.6 / 201.5 | 3 | 197.3 Hz | 0.0280 / 0.0134 | 1: 0.200 × 0.760; 2: 0.100 × 0.624 |
| 11 | M = 3 | + 1229 / 1231 / 1234, + 3439 / 3445 / 3454 | 5 | 233.8 Hz | 0.0318 / 0.0135 | 1: 0.200 × 0.760; 2: 0.100 × 0.624 |

What the numbers say, and no more: the three low modes are unchanged to
the hertz (the attachment normalization makes M = 1 today's grove), so
the relationship readout, the low-band swells, is identical in time and
ratio; the added partials sit at the beam's 6.3× and 17.5× ratios, two of
them above −40 dB at 50 ms, and decay 6–18× faster than the fundamentals
(0.38 s and 0.14 s against 2.4 s for seed 3), so they color the onset and
leave the ring to the low modes; the modal centroid estimate rises 10–20%
and RMS is essentially equal, so the difference is timbre, not loudness;
full-render peaks rise 8–13%. Whether this sounds like a thing with a material is for the
audition; the discarded damping on these voices is ≈ 8e-5 relative.

## Contract for an optional playable study (015c), proposed

If the audition favors the richer voice, it becomes an explicitly optional
study beside the default Grove, never a silent replacement:

- **Voice configuration** (separate from the v1 grove record):
  `{ version: 1, partials: 3, attachU: 1, pickupU: 1, strikeU: [0.3, 1] }`.
  Attachment and pickup fixed at the tip (the M = 1 equivalence point);
  the playable strike position bounded to `u ∈ [0.3, 1]` because the
  clamped-free shapes vanish toward the clamped end, where a strike would
  be nearly silent at any force; the page may expose position as a second
  gesture axis (e.g. where on the shell you touch) within that range, or
  fix it at 0.6 (the measured default).
- **Low-band readout for the picture:** the shell animation reads the
  coherent envelope of the normal modes below 1.5× the lowest body tuning
  (the `lowBandIndex` the comparison uses), exactly as the M = 1 grove's
  envelope is computed today, so the relationship readout is the same
  quantity in both voices and never the all-band envelope (which beats at
  audio rates with partials present). An optional bounded readout for the
  partials, a temporal RMS of the all-band envelope with a stated window
  (e.g. 20 ms), may light the core only, labeled as such.
- **Audio** keeps the fixed-gain, unit-bank, admission and capture
  mechanics of the Grove; the unit bank for the richer voice is built from
  `modalNetwork` the way the comparison tool builds it, with the strike
  position quantized to a small set of unit buffers (e.g. 0.3, 0.45, 0.6,
  0.8, 1.0) so captures stay exact and reproducible from the record.
- **Record:** `{ kind: 'imagimusic-grove', grove, voice, events: [{ frame,
  body, velocity, strikeU }], … }`; a record without `voice` is the
  default Grove; the page never alters v1 records.

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
