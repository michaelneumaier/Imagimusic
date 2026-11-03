# A spatial rule for a constructed resonance sketch

Astra, 2026-11-03. Numerical/model foundation only. No new spatial page, recovered geometry, listener assessment or peer approval.

## What is authored

The fitted scalar mixture does not identify mode shapes, an excitation position or a pickup position. This experiment explicitly assigns the ascending supplied modes the peak-one shapes `phi_i(u) = sin((i+1)*pi*u)` on a dimensionless interval `0 <= u <= 1`. The assignment and its order are authored choices. Although these profiles are orthogonal under an interval integral, the independently supplied frequencies and decays do **not** establish a conventional string, beam, local material law or mass density.

The source sketch's signed quadratures become chosen generalized-coordinate initial conditions. For activation position `a`, multiply both initial displacement and velocity of mode `i` by `phi_i(a)`. This spatially weights the existing activation; it is not a point-force impulse and does not infer how the recording was excited. The resulting coordinate `q_i(t)` still obeys the source's independent unit-mass damped oscillator equation. Its energy is nonnegative and its free energy loss remains the sum of the modes' damping losses. There is no bridge or energy transfer among modes.

At a pickup position `p`, the field is `w(p,t) = sum(phi_i(p) * q_i(t))`; its time derivative supplies the point velocity. The output is `source.pickupGain * w(p,t)`. This is a signed displacement pickup, not sound radiated into air. A pickup only observes the field: moving it does not alter the generalized modal states or their energy.

This changes the supplied scalar mixture by the product `phi_i(a)*phi_i(p)`. There is generally no position pair where every product is one. Therefore the spatial construction must remain comparable with, and clearly distinct from, the original non-spatial sketch; it is not advertised as adding geometry while preserving that original sound exactly.

## Bound and silence

Because each shape has magnitude at most one, the source's conservative amplitude bound remains valid for all activation/pickup pairs. The source pickup gain is fixed across every position, including near nodes. No per-position normalization lifts a quiet location. Exact represented nodes are handled as zero rather than a tiny sine-roundoff residue; endpoints can yield an entirely silent activation or pickup. Silence is an admissible response, not a failed preparation.

The renderer retains the source rate/duration restrictions and the declared final 25 ms playback fade. It currently invokes the source renderer to share its admission/fade contract, then constructs the spatial output. That duplicates some rendering work; no live performance claim is made. A future playing implementation should reuse prepared per-mode samples while retaining this fixed-gain contract, rather than regenerate or renormalize a voice at every position.

## Evidence

Three focused tests pass in `tests/sketch-spatial.test.js`:

- All represented nodes for the first four shapes are exact zero; lobes retain their signs; sampled profile inner products reproduce zero cross-terms and norm-squared 0.5.
- The pickup equals the signed projection of the underlying modal state. Centered time differences reproduce its velocity. Swapping activation/pickup gives the same response under this chosen separable rule. A middle-node activation gives the second mode zero energy, and changing only the pickup leaves every modal state unchanged. Invalid positions, ages and strengths are refused.
- Rendered samples agree with the point state through the declared fade, remain bounded at several positions, and preserve zero/near-zero node responses without normalization.

`node tools/study-sketch-space.mjs` reproduces a five-route synthetic study with modes 200/201/320 Hz, decays 2/0.8/3 s and explicitly declared signed quadratures. All use gain 0.1290100799, four seconds at 8 kHz, with the same ending fade. Metrics describe Float32 samples, not perceived differences.

| Activation / pickup | Mode weights (rounded) | Sample peak | Sample RMS | Relative RMS difference from 0.25 / 0.25 |
| --- | --- | --- | --- | --- |
| 0.25 / 0.25 | 0.5, 1, 0.5 | 0.127599 | 0.031623 | 0 |
| 0.25 / 0.75 | 0.5, −1, 0.5 | 0.112957 | 0.032049 | 0.203921 |
| 0.5 / 0.5 | 1, 0, 1 | 0.234641 | 0.063347 | 1.013474 |
| 0.05 / 0.25 | 0.110616, 0.309017, 0.321020 | 0.051004 | 0.014851 | 0.616621 |
| 0 / 0.25 | 0, 0, 0 | 0 | 0 | 1 |

Reversing activation/pickup gives Float32-identical renders on all five routes. The first two routes have the same modeled energy at 0.5 s because their excitation is unchanged; only the pickup changes. The second mode's sign reversal changes the observed waveform even though the two RMS levels are close. These establish model consequences, not human audibility or appeal.

## Next playable step

Use a plainly labelled strip for the authored coordinate, with independently selectable activation and pickup positions. Draw the chosen static mode profiles and current participation weights; do not animate audio-frequency phase at display rate or suggest an inferred local bridge. Begin with explicit listening, node silence explained as a valid outcome, fixed pickup gain, and an easy return to the non-spatial source sketch. Keep the existing address schema unchanged until the spatial choices have their own versioned record contract. First verify actual playback against this field; only then assess whether people can understand the spatial change and find a musical use for it.
