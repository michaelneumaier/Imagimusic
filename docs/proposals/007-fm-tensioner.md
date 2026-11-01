# Proposal 007: FM tensioner (003 part B), implementable contract

*Fable, 2026-11-01, at Astra's request. Pure math and tests on Fable's side
once agreed; Astra owns the visual study, scene bindings and any live
adapter. Nothing is implemented yet.*

## What it is, and is not

A **modulator** wheel is rodded to a **tensioner** on a **carrier** string:
as the wheel turns, the rod pulls the string's tension up and down at the
wheel's rate, so the carrier's pitch moves at audio rate and sidebands
appear. This is **one-way and interpreted**: the modulator drives the
carrier, nothing comes back. The reciprocal Loom (003 A) stays the physical
family; the tensioner is the mechanism that explains a familiar synth sound
(FM) with a visible cause. The caption says so.

## Answers to the five questions

### 1. Phase with a time-varying envelope (no `phase = f(t)·t`)

Linear FM in hertz, as the tensioner story and the native engine both
imply. The carrier's instantaneous frequency is

```
f(t) = f_c + D(t)·sin(2π f_m t),     D(t) = D₀·e^{−t/τ_I}       (deviation in Hz, decaying index)
```

and the phase is the **integral** of that, which is closed form:

```
φ(t) = 2π f_c t + 2π D₀ · ∫₀ᵗ e^{−τ/τ_I} sin(2π f_m τ) dτ
     = 2π f_c t + 2π D₀ · [ ω_m − e^{−t/τ_I}( ω_m cos ω_m t + (1/τ_I) sin ω_m t ) ] / ( (1/τ_I)² + ω_m² ),   ω_m = 2π f_m
```

so `φ(t)` is an exact function of `t`: any time, any order, no accumulator,
no `phase = f_inst·t` error (that would be wrong the moment `D` or `f_m`
changes). The output is `x(t) = A₀·e^{−t/τ_A}·sin(φ(t) + φ₀)`. A constant
index is the special case `τ_I → ∞`, where the integral is
`(D₀/f_m)·(1 − cos ω_m t)/(2π)`, i.e. classic FM with index `I = D₀/f_m`.

### 2. Alias policy

Two bounds, both validated at construction for the given sample rate, both
reported as numbers the picture can show:

- instantaneous frequency must stay positive and below the guard:
  `f_c + D₀ ≤ 0.45·sr` and `f_c − D₀ > 0`;
- the spectrum's extent by Carson's rule must stay below the guard:
  `f_c + (D₀ + f_m) ≤ 0.45·sr` (equivalently `f_c + (I+1)·f_m`), which is
  the stricter one; reject (not clamp) inputs that violate it, with the
  message naming the bound. The picture never draws audio-rate anything;
  it draws `index(t)`, `deviationHz(t)` and `bandwidthHz(t) = 2·(D(t) + f_m)`
  as a visible "blur width" of the string. No alias can appear in the
  picture because nothing audio-rate is sampled into it.

### 3. Linear FM vs phase modulation

With a constant index they differ only by a phase shift. With a decaying
index they differ audibly: FM integrates `D(t)`, so the pitch excursion
shrinks as the rod relaxes; PM would apply `I(t)` to the phase directly.
We implement **linear FM in hertz** because (a) the mechanism is a
tensioner changing frequency, (b) it matches what a native
`modulator → gain(Hz) → carrier.frequency` graph computes, and (c) it keeps
the units clean: `D` in Hz, `I = D/f_m` dimensionless (the earlier
`indexHz·f_m` mistake stays withdrawn). PM is documented as "not this
mechanism".

### 4. Musical range and reference spectral cases

Bounds: `carrierHz` 40–2000, `ratio` 0.25–8 (f_m = ratio·f_c), `index`
(I₀ = D₀/f_m) 0–10, `indexDecayS` 0.02–8, `ampDecayS` 0.05–8, `level` 0–1,
all subject to the alias policy. Reference cases, each a test:

- **Bessel sidebands.** Constant index (large `τ_I`), ratio 1, `I = 1` and
  `I = 2.405`: DFT of a steady 1 s segment (Hann, 2^16 points, 48 kHz)
  gives sideband amplitudes at `f_c ± k f_m` proportional to `|J_k(I)|`
  within 2 % for k = 0..4; at `I = 2.405` the carrier component vanishes
  (below −40 dB relative to the strongest sideband).
- **Carson bandwidth.** 99 % of the spectral energy lies within
  `f_c ± (D₀ + f_m)` for `I ∈ {1, 3, 5}`.
- **Inharmonic ratio.** Ratio 3.5 (classic bell): the sidebands are not
  harmonics of `f_c` (no component within 1 % of any integer multiple of
  `f_c` except the carrier).
- **Decaying index.** `I₀ = 5`, `τ_I = 0.3 s`: at `t = 2 s` the spectrum is
  a pure carrier (all sidebands below −40 dB), at `t = 0.05 s` it is not.
- **Phase correctness.** `φ(t)` matches a fine numerical integration of
  `2π f(τ)` (trapezoid, 1e-6 s) to 1e-6 rad over 0.5 s for a decaying
  index; and `dφ/dt` from finite differences equals `2π f(t)` to 1e-6
  relative.
- **Determinism and seeks.** Same inputs → identical PCM; `x(t)` evaluated
  in shuffled order equals sequential; `render` at any `t` equals `x(t)`.

### 5. One-way interpreted vs reciprocal physical

The tensioner is **interpreted**: no back-reaction, no energy accounting
beyond the stated decays. Label: "Interpreted mechanism: a modulator
stretches a carrier's tension; the sound is linear FM in hertz; the string
blur shows the bandwidth, not vibration." The Loom stays
"reduced physical model". The two must not be conflated in a caption.

## Contract: `src/fm.js` (pure, deterministic, time-indexed)

```js
DEFAULT_TENSIONER = { carrierHz: 220, ratio: 2, index: 3, indexDecayS: 0.8, ampDecayS: 1.5, level: 0.19, phase0: 0 }
validateTensioner(block, sampleRate = 48000) -> bounded copy with derived { modulatorHz, deviationHz, bandwidthHz }; throws on bounds or alias policy
tensionerState(t, tn) -> { index, deviationHz, bandwidthHz, tension01: index/tn.index, amplitude: level·e^{−t/τ_A}, modulatorPhase01, frequencyMeanHz: carrierHz }
   // picture-facing: no audio-rate fields; modulatorPhase01 is sub-audio only if f_m < 20 Hz, else omitted
tensionerPhase(t, tn) -> φ(t)  (radians, closed form above)
tensionerSample(t, tn) -> amplitude(t)·sin(φ(t) + phase0)
renderTensioner(tn, sampleRate, durationS) -> Float32Array    // PCM from the model, exactly tensionerSample at n/sr
```

**Sound path:** like the Loom, the PCM is produced by the model and played
from an `AudioBuffer`, so the picture and the sound are the same equations
by construction. A native graph (`modulator osc → gain = D(t) automation →
carrier.frequency`) is a possible later *live* adapter; it integrates
frequency per sample and would differ from the closed form at the
rounding level, so it would be labeled an approximation and never used for
exports.

## Picture (Astra's study)

A carrier string between a clamp and the tensioner; a modulator wheel whose
rod pulls the tensioner; `tension01` = rod strain and the wheel's visible
rate for `f_m < 20 Hz` only (above that the wheel is drawn as a blurred
disc with its rate printed, like the fast pendulum); the string's drawn
width = `bandwidthHz` on a stated scale; amplitude = glow; the rod relaxes
as the index decays. Bindings declared with inputs
`fm.carrierHz, fm.ratio, fm.index, fm.indexDecayS, fm.ampDecayS`.

## Decisions for Astra

1. Approve linear FM in hertz with the closed-form phase, and the alias
   policy as reject-not-clamp.
2. Approve the reference cases and tolerances (2 % Bessel, −40 dB
   carrier null at 2.405, 99 % Carson).
3. Approve PCM-from-model as the sound path for study and export, native
   FM as a labeled live approximation only if ever wanted.
4. Ownership: Fable `src/fm.js` + `tests/fm.test.js`; Astra study page,
   bindings, scene, any adapter.
