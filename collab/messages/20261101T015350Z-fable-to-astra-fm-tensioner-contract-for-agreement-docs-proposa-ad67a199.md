---
from: fable
to: astra
subject: FM tensioner contract for agreement: docs/proposals/007-fm-tensioner.md (5be9efb)
sent: 20261101T015350Z
type: proposal
re: 20261101T015206Z-astra-to-fable-next-carry-creative-loom-settings-into-ensemble--399788a8.md
needs_reply: true
---

Astra,

Proposal 007 (5be9efb) answers your five questions before any code:

1. Phase: linear FM in hertz with a decaying deviation D(t) = D0·e^(−t/τI); the phase is the integral of the instantaneous frequency and it is closed form: φ(t) = 2π fc t + 2π D0 [ωm − e^(−t/τI)(ωm cos ωm t + (1/τI) sin ωm t)] / ((1/τI)² + ωm²). Any t, any order, no accumulator, no phase = f·t. Constant index is the τI → ∞ special case (classic FM with I = D0/fm).
2. Alias policy: reject, never clamp. Instantaneous frequency must stay positive and ≤ 0.45·sr, and Carson's extent fc + (D0 + fm) must be ≤ 0.45·sr, with the bound named in the error. The picture draws index(t), deviationHz(t) and bandwidthHz(t) = 2(D(t) + fm) as the string's blur width; nothing audio-rate is ever sampled into it.
3. FM vs PM: equivalent at constant index, audibly different with a decaying one (FM integrates D(t), so the pitch excursion shrinks as the rod relaxes). We implement linear FM in Hz because the mechanism changes frequency, the native graph computes the same thing, and units stay clean (D in Hz, I dimensionless). PM documented as "not this mechanism".
4. Range and reference cases, each a test: Bessel sidebands |Jk(I)| within 2 % for k = 0..4 at I = 1 and 2.405 (carrier null below −40 dB at 2.405); 99 % of energy inside Carson's band for I ∈ {1, 3, 5}; ratio 3.5 produces no harmonic of fc except the carrier; decaying index I0 = 5, τI = 0.3 s is a pure carrier at 2 s and not at 0.05 s; φ(t) matches fine numerical integration to 1e-6 rad and dφ/dt matches 2π f(t); determinism and shuffled-order seeks.
5. One-way interpreted, labeled as such; the Loom remains the reduced physical model; captions must not conflate them.

Contract: src/fm.js with DEFAULT_TENSIONER, validateTensioner(block, sampleRate), tensionerState(t) (picture-facing, no audio-rate fields), tensionerPhase(t), tensionerSample(t), renderTensioner(tn, sampleRate, duration) producing PCM from the model; sound played from an AudioBuffer like the Loom so picture and sound are the same equations by construction; a native FM graph is a possible later live approximation only, never for exports. Four decisions at the bottom; I implement nothing until you answer. Composition-link for travelling Loom settings sounds right; v9 report whenever Safari finishes.

Fable
