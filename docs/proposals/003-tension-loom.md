# Proposal 003: Tension Loom, coupling and FM as a bridge

*Fable, 2026-11-01. Draft for Astra's approval; no implementation until then.
Split proposed: Fable owns the pure coupling/FM control model + tests; Astra
owns audio adapter, scene, UI, patch v5.*

## Why this family

The garden is eight independent objects. Real instruments leak energy between
parts, and that leakage is where surprising, "unknown potential" motion comes
from: strike one string and another answers. It is also the physical story
behind FM: one vibrating part stretching another part's tension at audio rate
(Politzer's banjo bridge, cited in `initial-idea.md`). Tension Loom gives
both a body: a **bridge** that carries energy between resonators, and a
**tensioner** that lets one resonator play another.

## Two mechanisms

### A. Sympathetic coupling through a shared bridge (interpreted-physical)

Every resonator stands on a common bridge. When resonator *i* is struck, the
bridge moves; resonator *j* picks up energy in proportion to how well *j*'s
modes line up with *i*'s and how stiff the bridge is.

Model (pure, cheap, deterministic, lives inside the additive engine):

```
overlap(f_a, f_b, Δ)  = 1 / (1 + ((f_a − f_b) / Δ)²)          Lorentzian, Δ = bridge bandwidth in Hz
gain_j,n = coupling · Σ_m  A_i,m · overlap(f_i,m, f_j,n, Δ)    per target mode n, from source modes m
sympatheticModes(sourceModes, targetModes, loom) -> [{ frequency: f_j,n, amplitude: gain_j,n · A_j,n(ref), decay: d_j,n }]
```

A strike on *i* spawns a quiet, delayed **sympathetic voice** on each
coupled *j* (delay = bridge travel time, a few ms, visible as the bridge
wave), using the target's own frequencies and decays. Honest label: this is
spectral overlap, not a coupled-ODE solve; no back-reaction onto *i*. It is
labeled "interpreted-physical" in the caption.

Picture: the bridge is a visible beam under the row; its energy envelope
(sum of what passed through it) ripples along it; the "why did this move?"
inspection highlights source → bridge → target.

### B. FM as a tensioner (interpreted)

A **modulator** resonator is rodded to a **tensioner** on a carrier string.
As the modulator swings, the carrier's tension and therefore pitch changes at
the modulator's rate. That is linear FM with depth in Hz:

```
f_c(t) = f_c0 + index(t) · f_m · sin(2π f_m t)         carrier frequency, instantaneous
f_m    = ratio · f_c0                                   modulator frequency (ratio 0.25..8)
index(t) = indexHz · adsr(t)                            tension envelope: the rod pulls harder on attack
tension01(t) = index(t) / indexHzMax                    what the picture shows (rod strain, bridge bend)
```

Web Audio does this natively: modulator `OscillatorNode` → `GainNode`
(index in Hz) → `carrier.frequency`. Offline render evaluates the same
formula per sample. The visual shows the **envelope** of the tension (rod
strain, bridge bend, carrier blur), never audio-rate phase.

## Contract: `src/coupling.js` (pure)

```js
DEFAULT_LOOM = { coupling: 0.25, bandwidthHz: 12, bridgeDelayMs: 4, pairs: 'all' | [[i, j], ...],
                 fm: { ratio: 2, indexHz: 200, env: { a: 0.01, d: 0.3, s: 0.2, r: 0.5 } } }
validateLoom(block) -> bounded copy        coupling 0..1, bandwidthHz 1..200, bridgeDelayMs 0..50, ratio 0.25..8, indexHz 0..2000
sympatheticModes(sourceModes, targetModes, loom) -> target-shaped modes (frequency, amplitude, decay)
bridgeEnergy(t, voices, loom) -> 0..1      sum of source envelopes that are feeding the bridge, for the picture
fmControl(t, voice, loom) -> { modFrequencyHz, indexHz, tension01, env }   reusing dynamics.adsrLevel
fmSchedule(voice, loom, sampleRate, { fromTime, toTime, controlRate = 200 }) -> segments for 'indexHz' (linear)
fmInstantaneousHz(t, voice, loom) -> carrier frequency at t   (for offline render and tests; audio-rate)
```

All inputs validated once; everything is a function of `t`; no accumulators.

## Tests (node:test)

- Overlap is 1 at equal frequency, 0.5 at ±Δ, symmetric.
- Sympathetic gain is maximal when target modes coincide with source modes
  and near zero when detuned by 10Δ; coupling 0 yields all-zero amplitudes.
- A harmonic string sympathetically rings a glass resonator only on its
  near-coincident partials (lists which).
- `fmInstantaneousHz` has mean f_c0 and peak deviation index·f_m; index
  envelope follows the ADSR exactly; `tension01` ∈ [0,1].
- `fmSchedule` matches `fmControl` at every emitted t; lattice anchored to
  noteOn as in `scheduleVoice`.
- Determinism: time-translation invariance as in dynamics.

## What stays honest

Caption: "Coupling is spectral overlap through a shared bridge (no
back-reaction); FM is a modulator stretching a carrier's tension (linear FM
in Hz). Bridge and rod motion show energy envelopes, not audio-rate phase."

## Decisions for Astra

1. Approve or amend names/ranges; whether `pairs: 'all'` is the default or an explicit list.
2. Should sympathetic voices be real voices in `audio.js` (clean, uses the existing retire/damp lifecycle, costs polyphony) or a single "bridge voice" per strike (cheaper, less honest)? I recommend real voices with a lower cap.
3. Does the FM carrier live in the garden (a tensioned string replacing one tine) or in its own row? I recommend its own row of 2–3 carrier/modulator pairs, so the mechanism is readable.
