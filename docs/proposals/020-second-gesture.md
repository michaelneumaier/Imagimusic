# Proposal 020: The second gesture

*Fable, 2026-11-01, answering Astra's question: where does the instrument invite a second meaningful gesture after its first ring? Two answers, one measured and ready to audition, one a bounded experiment on a new axis. Neither adds a panel, a random visual or a claim about consciousness.*

## A. Within today's vocabulary: the neighbour strike, timed against the beat (measured)

Every curated grove tunes its two lowest coupled modes a few hertz apart, so one strike beats slowly (periods 0.41 s on seed 3, 2.46 s on seed 7, 0.44 s on seed 11). A second strike on the bridged neighbour adds to or subtracts from that beat depending on when it lands. Measured with `measureSecondStrike` (struck shell's low-band motion at its pickup, 1 s after the neighbour strike, relative to the single strike; relative amplitude, not loudness):

| seed | beat period | consequence of timing across one beat | whole stereo swing |
|---|---|---|---|
| 3 | 0.41 s | −1.4 … +1.4 dB | +2.4 … +5.1 dB |
| 7 | 2.46 s | 0.0 … +3.6 dB | 0.0 … +9.5 dB |
| 11 | 0.44 s | −1.5 … +6.4 dB | −2.9 … +5.6 dB |

So the instrument already answers a *when*, not only a *where*: on seeds 7 and 11 the same two gestures differ by 4–8 dB in what remains, by timing alone. This is a **timing-sensitivity measurement** (Astra's review, 0846Z): each delay also changes the carrier phase of the second strike and how far the first ring has decayed, and the ratio is taken against a single-strike window that moves with the delay. It does not show that the extrema coincide with a visible swell or dip of the glow, and no instruction to strike "on a swell" is proposed until data associate the pre-strike visible envelope with the outcome; `measureSecondStrike` records that envelope per exact frame (`envelopeBefore`) so the association can be tested. Measured and rendered are one thing: every point carries its exact frame, `composeSecondStrikeRecord(recipe, { frame })` authors from that frame, and the delay in seconds is derived from it (Astra measured the earlier rounded reconstruction at up to 0.05 dB off on seed 3; small there, but the contract is now exact).

**The encounter, if listening supports it:** a line in the guide inviting a second strike on the neighbour while the first still rings, worded for timing and not for the picture.

**Honest evaluation:** (1) `composeSecondStrikeRecord(recipe, { frame })` at the measured maximum and minimum sampled-ratio frames per grove gives six two-strike records; Astra's `tools/render-timing-pairs.mjs` renders natural-level A/B pairs with a condition reveal (labelled as maximum and minimum sampled pickup ratio, never best or worst), no RMS matching within a pair because timing-caused level change is part of what is evaluated; (2) Michael listens and says whether a difference is audible and whether it is musical; (3) only if yes does the guide gain the line, and the model text one sentence ("a second strike can add to or take from what remains, depending on when it lands"); (4) the measured table goes in the validation note as what the pairs contain, not as what is heard.

## B. A new axis: sustained excitation with an explicit force law (bounded experiment, not production)

Everything in the instrument decays; nothing can be held in sound. Sustain is the second gesture the instrument does not yet have, and it is on the right axis: the person supplies energy continuously, then leaves the bodies to answer. The honest way in is an explicit force at a point, applied to the same exact linear model:

- **Kernel.** With forcing the step is x ← Φ x + Γ u, where Γ = ∫₀ʰ e^{Sτ} dτ · B is the zero-order-hold input matrix for a unit force on one body at position u (computed once per sample rate beside Φ, by the same exponential), and u is the force sample. The linear evolution stays exact; only the input is new.
- **Force law, stated (revised after Astra's brief and review).** First prototype: an exogenous powered sinusoidal driver at a declared frequency (a body tuning), a declared amplitude from the energy budget, applied at one existing strike coordinate for a stated time, then removed; not a bow, hand, breath or actuator; no state-dependent friction yet (the friction curve first proposed is discontinuous at zero, and sampled once per step it would not be exact; a separate problem for later, if ever). The declared input is the sample-held sinusoid (zero-order hold) and the evolution under it is exact: x ← Φ x + Γ f with Γ = ∫₀ʰ e^{Sτ} dτ · b from one exponential of the augmented matrix [[S h, b h], [0, 0]]. Landed as `forcedStepper` in `src/coupling.js`; tested: zero force agrees with the passive stepper to 1e-10, Astra's budget √(2E(t)) ≤ √(2E₀) + ‖b‖∫|f| holds at every sample under the driver with and without a contact, and a first-order work/dissipation balance closes within 5 %.
- **Admission.** Astra's budget is the honest one for a continuous source: the passive bound applies only while no force acts; under the driver √(2E) ≤ √(2E₀) + ‖b‖∫|f|, so a declared amplitude and duration give a predicted output ceiling before rendering; the predicted bound and the observed peak are reported separately; nothing is boosted or limited after rendering.
- **Record.** Continuous input is a sample stream, not events; a bowed passage is kept as the force samples at the audio rate (or the pointer path at a stated rate with a stated interpolation), so rebuild stays exact and the verifiers unchanged in kind.
- **Bounded experiment, offline only:** implement Γ and the friction law in the pure layer; render a bowed stroke on one body of each grove (2 s of bow at three speeds); measure whether a sustained tone appears (the low-band envelope's steadiness), its pitch relative to the partials, the energy input per second, and that the ceiling is never crossed; produce audition files with Astra's tool. No page, no worklet, no production change until the sound is heard and judged.

## Order
1. A now: audition pairs from the measured delays (Astra's tool), listening by Michael.
2. B as a pure-layer experiment with measurements and files; design note by Astra tying it to the gesture vocabulary; decide after listening.

## Not in scope
No new panel, no animated target, no automatic sound, no claims about what the listener feels.

## B, first measurements (2026-11-01, after Astra's blockers were fixed)

Driver at each body 0's tuning, 2 s on then 3 s released, amplitude from the exact zero-order-hold budget at half the admission ceiling (predicted bound 0.45 everywhere): observed peaks free / hand on driven / hand on neighbour: seed 3 0.040 / 0.0001 / 0.050; seed 7 0.042 / 0.0001 / 0.039; seed 11 0.031 / 0.0001 / 0.014. Two measured statements: the budget is conservative by roughly ten times for a resonant drive; a firm hand on the driven body attenuates the output by about 52 dB at the pickups while the driver runs (strong attenuation, not established audible silence), and a hand on the neighbour leaves the instrument sounding, on seed 3 slightly louder at the pickups. The contact stays for the whole study in the hand cases; driver release is not a hand lift. Whether the build-and-release is audible or worth playing remains a listening question; Astra's plots and audition page follow from the saved reports.

## B, model foundation and a measured limit (2026-11-01, evening)

Landed: the powered engine (Φ and Γ per contact state, continuous across switches), a powered recipe, and record kind `imagimusic-grove-powered` version 2 whose declared source is a rotation recurrence from stored constants (law `rotation-recurrence-v1`), with the loudness budget summed from the actual declared samples; the verifier rebuilds the kind; Astra's processor, worklet, preparation worker and capture adapter run it with Node scheduling tests and fresh Safari captures. Parity: constant-contact passages agree with the audited forced studies to rounding; zero force equals the Rest route; a contact switch leaves the state untouched and the budget holds across it.

Measured cross-runtime limit, reproduced independently: a Safari capture rebuilt in Node differs in 2 of 241200 left-channel float32 samples by at most 1.46e-11 on seed 3 at 48 kHz (right channel exact); seed 7 at 44.1 kHz is exact in both channels; within one runtime the worklet, the capture replay and the exported WAV are exact. Agreed direction (Astra as lead): stop changing the force or model contract to chase universal bit identity; keep the raw source PCM hash as exact provenance, describe cross-runtime reconstruction separately with measured differences when actual samples exist, never pass a failed hash silently. Next: host and UI for the bounded encounter; no appeal claim from any of this.
