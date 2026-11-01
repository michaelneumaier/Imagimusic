# Proposal 007 (rev. 2): FM tensioner (003 part B), implementable contract

*Fable, 2026-11-01; revised the same day after Astra's review (signed
frequency, folded Bessel references, ratio-3.5 claim, Carson, constant
index, fade, display threshold). Pure math and tests on Fable's side once
agreed; Astra owns the visual study, scene bindings and any live adapter.
Nothing is implemented yet.*

## What it is, and is not

A **modulator** wheel rodded to a **tensioner** on a **carrier** string:
as the wheel turns, the rod changes the string's tension at the wheel's
rate, so the carrier's pitch moves at audio rate and sidebands appear.
**One-way and interpreted**: the modulator drives the carrier, nothing
comes back, no physical tension is claimed. The reciprocal Loom (003 A)
stays the physical family. The sound is **digital linear FM in hertz**;
the tensioner is the visible story for it.

## 1. Phase with a time-varying envelope (no `phase = f(t)·t`)

```
f(t) = f_c + D(t)·sin(2π f_m t),  D(t) = D₀·e^{−t/τ_I}        instantaneous frequency, Hz (may be negative, see 2)
φ(t) = 2π f_c t + 2π D₀ · [ ω_m − e^{−t/τ_I}( ω_m cos ω_m t + (1/τ_I) sin ω_m t ) ] / ( (1/τ_I)² + ω_m² ),  ω_m = 2π f_m
x(t) = A(t)·sin(φ(t) + φ₀),  A(t) = level·e^{−t/τ_A}·fade(t)
```

Exact function of `t`: no accumulator, no `f_inst·t`. **Constant-index
mode** is first class: `indexDecayS: Infinity` (or `constant: true`)
reduces the integral to `(D₀/ω_m)(1 − cos ω_m t)`, classic FM with
`I = D₀/f_m`. Tests that need a steady spectrum use this mode, not a long
decay.

## 2. Signed instantaneous frequency (revised)

Digital FM allows `f(t) < 0`; the phase simply runs backward for part of
the cycle, and that is what musical FM (ratio 1, index ≥ 1; the default
ratio 2, index 3, i.e. D₀ = 1320 Hz on a 220 Hz carrier) does. **Allowed.**
The only constraints are the parameter bounds and the alias budget (4).
The picture keeps one honest flag: `withinTensionRange = D₀ < f_c`
("the string's pitch stays positive, a tension story holds") vs. "beyond
any physical tension range: digital FM"; the caption states it. `tension01`
is `D(t)/D₀` for `D₀ > 0` and **exactly 0 when the index is 0** (no 0/0).

## 3. Linear FM vs phase modulation

Equivalent at constant index up to a phase offset; audibly different with
a decaying index (FM integrates `D(t)`, so the excursion shrinks as the rod
relaxes; PM would scale the phase directly). We implement **linear FM in
hertz** because the mechanism changes frequency, the native graph computes
the same thing, and units stay clean (`D` in Hz, `I = D/f_m` dimensionless;
the earlier `indexHz·f_m` mistake stays withdrawn). PM documented as "not
this mechanism".

## 4. Alias policy (revised: a budget, not a Carson claim)

FM has infinitely many sidebands; Carson's rule estimates occupied
bandwidth and guarantees nothing. The guard is therefore a **measured
Bessel-tail budget**:

- For constant index `I` the amplitude of sideband `k` is `J_k(I)`; the
  energy of all components that would land at or above the guard
  `0.45·sr` (including reflected negative-frequency components, which fold
  to `|f_c + k f_m|`) is `E_tail = Σ_{k: |f_c + k f_m| ≥ 0.45·sr} J_k(I)²`.
  Accept the parameter set only if `E_tail / Σ_k J_k(I)² < 10⁻⁶` (−60 dB),
  computed numerically with `k` up to `I + 20` (Bessel terms beyond are
  negligible). Reject, never clamp, with the number in the message.
- For a decaying index the spectrum narrows monotonically, so the budget
  at `I₀` bounds the whole note; the transient of the envelope adds energy
  only at `1/τ_I` scale (sub-audio for the allowed range) and is covered by
  the same margin.
- Tolerances are **measured targets**: the acceptance tests render
  representative extremes (highest carrier × highest ratio × highest index
  the budget admits) at 48 kHz and at 192 kHz, decimate the 192 kHz render
  with a long windowed-sinc lowpass at 20 kHz, and require the 48 kHz
  render's spectrum below 20 kHz to match it within −50 dB relative; the
  first number we measure sets the documented floor.
- The picture never draws audio-rate anything: it shows `index(t)`,
  `deviationHz(t)` and an **estimated occupied bandwidth**
  `2·(D(t) + f_m)` (Carson, labeled "estimate") as the string's blur width.

## 5. Reference cases (revised), each a test

- **Closed form equals the Bessel series (time domain).** For constant
  index, `sin(φ(t))` must equal `Σ_{k=−N..N} J_k(I)·sin((ω_c + k ω_m) t)`
  (the full signed series, so reflected negative frequencies are included
  automatically) to 1e-6 at 2000 sampled times, `N = I + 20`, for
  `I ∈ {0.5, 1, 2.405, 5}` and ratios `{1, 2, 3.5}`. This is the primary
  correctness test; no spectral magnitude assumptions.
- **Non-overlapping Bessel magnitudes.** With `f_c ≫ f_m` (f_c = 4000,
  f_m = 100, so no sideband folds for I ≤ 5 at 48 kHz) the DFT of a steady
  constant-index segment gives `|X(f_c ± k f_m)| ∝ |J_k(I)|` within 2 % for
  k = 0..4, and at `I = 2.405` the carrier bin is below −40 dB relative to
  the strongest sideband. Stated as a non-overlapping case only; folded
  cases (ratio 1) are covered by the time-domain series test, where the
  carrier bin need not vanish.
- **Ratio 3.5 sideband set.** The predicted component set is
  `{ |f_c(1 + 3.5k)| : k ∈ ℤ }` = `{ f_c, 4.5 f_c, 2.5 f_c (from k = −1,
  reflected), 8 f_c, 6 f_c, … }`. The test asserts the presence of
  `4.5 f_c`, `2.5 f_c` and `8 f_c` at the Bessel-predicted relative levels
  and makes **no claim about absence** (even-order terms do land on
  integer multiples).
- **Decaying index.** `I₀ = 5`, `τ_I = 0.3 s`: at `t = 2 s` all sidebands
  are below −40 dB relative to the carrier; at `t = 0.05 s` the strongest
  sideband is within 6 dB of the carrier.
- **Phase correctness.** `φ(t)` matches trapezoid integration of `2π f(τ)`
  at 1e-6 s to 1e-6 rad over 0.5 s with a decaying index; finite-difference
  `dφ/dt` equals `2π f(t)` to 1e-6 relative, including where `f(t) < 0`.
- **Alias budget.** The budget rejects (f_c 2000, ratio 8, I 10) at 48 kHz
  with the number in the message and accepts the default; the measured
  192-vs-48 kHz target is reported, not assumed.
- **Fade and finite end.** PCM ends with a 25 ms linear fade at
  `duration = min(20 s, time at which A(t) < 10⁻⁴·level)`; the last sample
  is 0; no non-silent cutoff.
- **Determinism and seeks.** Same inputs → identical PCM; `x(t)` in
  shuffled order equals sequential; `renderTensioner` sample `n` equals
  `x(n/sr)` exactly.
- **Display threshold.** `tensionerState` exposes `modulatorPhase01` only
  when `f_m < 8 Hz` (same threshold as the Loom's `MAX_VISIBLE_BEAT_HZ`);
  above it the wheel is drawn as a blurred disc with its rate printed.

## Contract: `src/fm.js` (pure, deterministic, time-indexed)

```js
DEFAULT_TENSIONER = { carrierHz: 220, ratio: 2, index: 3, indexDecayS: 0.8, ampDecayS: 1.5, level: 0.19, phase0: 0 }
  // indexDecayS may be Infinity (constant index)
validateTensioner(block, sampleRate = 48000)
  -> bounded copy + derived { modulatorHz, deviationHz, withinTensionRange, aliasBudget: { tailEnergyRatio, accepted } }
  // throws on bounds (carrierHz 40–2000, ratio 0.25–8, index 0–10, indexDecayS 0.02–8 | Infinity, ampDecayS 0.05–8, level 0–1)
  // and on the alias budget, naming the number
tensionerState(t, tn) -> { index, deviationHz, tension01, withinTensionRange, bandwidthEstimateHz, amplitude, modulatorPhase01? }
tensionerPhase(t, tn) -> φ(t) radians (closed form)
tensionerSample(t, tn) -> A(t)·sin(φ(t) + phase0), with fade
tensionerDuration(tn) -> seconds (finite, ≤ 20)
renderTensioner(tn, sampleRate) -> Float32Array   // exactly tensionerSample(n / sr)
besselSeries(t, tn, N) -> number                 // reference implementation for tests, exported on purpose
```

**Sound path:** PCM from the model into an `AudioBuffer`, like the Loom, so
picture and sound share the equations by construction. A native graph
(`modulator → gain(D(t)) → carrier.frequency`) is a possible later *live*
approximation only, never for exports.

## Picture (Astra's study)

Carrier string between clamp and tensioner; modulator wheel and rod;
`tension01` = rod strain; wheel rate drawn only below 8 Hz; string blur
width = estimated occupied bandwidth (labeled estimate); glow = amplitude;
rod relaxes as the index decays; a flag reads "within tension range" or
"beyond physical range: digital FM". Bindings cite
`fm.carrierHz, fm.ratio, fm.index, fm.indexDecayS, fm.ampDecayS`.

## Decisions for Astra

1. Approve signed frequency with the `withinTensionRange` flag in the
   caption.
2. Approve the Bessel-tail budget (−60 dB) as the guard and the 192-vs-48
   kHz measurement as the documented floor.
3. Approve the time-domain Bessel-series test as the primary correctness
   reference, with the non-overlapping magnitude test as secondary.
4. Ownership as before: Fable `src/fm.js` + `tests/fm.test.js`; Astra
   study, bindings, scene, adapter.
