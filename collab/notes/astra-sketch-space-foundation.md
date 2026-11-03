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

## First spatial listening page

`sketch-space.html` (“Where a ring is met”) now opens from “Explore its spatial response” on a successfully prepared source sketch. The handoff carries the exact existing source address record, including its decay variation, and does not infer new parameters. Returning carries that same source record back quietly. A direct visit without a valid source asks the visitor to begin in the sketch; no substitute model is silently installed.

Two 0…1 sliders stage activation and pickup positions. Static SVG profiles show the authored basis, a dashed activation line and a pickup line; a table exposes signed activation/pickup products and mode frequencies. This diagram is labelled as the **staged** pair. Prepare renders a separate four-second, strength-0.35 mono response in a disposable worker at 48 kHz, using the source's fixed pickup gain. The listening section names the actual prepared pair; changing the draft does not change existing PCM or playback. These are successive explicit auditions, not live moving pickups or overlapping performance gestures.

Explicit Listen uses the existing `createGroveReplay` lifecycle. Quiet fades the current audition, page-away stops listening and cancels any pending worker, and stale results cannot restore cancelled preparation. Endpoints remain preparable: zero samples receive an explanatory silent-node message rather than an error or gain boost. The source record remains unchanged. Spatial positions are deliberately visit-local, disclosed in the page; this slice does not extend the kept-address schema.

Validation: 12 focused Node tests pass across the spatial model, shared replay and disposable-job lifecycle. `tests/sketch-space-browser.html` reports **PASS 4/4** in native Safari: actual module-worker samples equal direct spatial rendering; the real OfflineAudioContext replay graph reproduces the fixture with maximum sample error **0** using its 35 ms scheduling lead; an endpoint worker result is entirely zero at unchanged gain; cancellation rejects. The test clock is fixed and these results do not measure live-device output or latency.

Native Safari page flow confirms the 2× source variation handoff, initial fixed signed weights, silent preparation, explicit playback, Quiet while actively playing, and natural completion. Keyboard navigation reaches the activation slider; Home stages endpoint zero and updates the signed table without replacing the prepared pair. Preparing the endpoint shows “Activation 0.00 · pickup 0.25” and the silent-node explanation at the same 0.11911 source gain. The return link reopens the original source with its 2× multiplier and no audio. Desktop screenshot checked for readable table/transport and labelled profiles. Frequencies are also repeated in the HTML table so the SVG labels are not their only representation. Narrow-screen verification and listener assessment remain follow-ups; no peer approval is claimed.

## Hold a pair for comparison

The spatial page now lets a visitor explicitly hold the current prepared PCM/position pair in memory, prepare another, and choose either audition without rebuilding the held one. Source parameters, strength, render duration and pickup gain remain the same; only the chosen activation/pickup pair changes. The held caption records those positions and gain. Draft sliders and replacement preparation do not mutate the held samples. This is a visit-local comparison, not a new saved-record format or evidence of perceptual level matching.

Both choices use the same replay controller. Choosing the other pair stops/fades the previous source and schedules the chosen response from its beginning through the existing replay lifecycle. Playback status names current versus held and the actual positions. Holding/replacing the reference is disabled during playback; releasing it stops playback if the held role is active, clears only that reference, and leaves the current prepared pair available. Leaving the tab stops audio but retains the two visit-local prepared pairs; a page reload still discards them as documented.

Native Safari checks: prepare/hold 0.25 activation and 0.25 pickup; stage pickup 0.50 and prepare it while retaining the held caption; play current 0.25/0.50 and switch to held 0.25/0.25, with both status identities verified; release during held playback, yielding the released/empty-reference state and disabled Quiet. The source gain remains 0.11911 for both on the tested 2× source. The 12 focused spatial/replay/job tests still pass. These checks establish state and transport behavior, not a listener's preference or a new offline render equivalence claim.

## Narrow-screen comparison layout

At 390 × 656 in native Safari responsive preview, current and held auditions now sit beside one another above a full-width Quiet control. The group stays at the top while reading within the listening section. Prepare sits directly after the position controls; the signed table has an optional disclosure while the authored profiles stay visible. Buttons move focus to the listening or position heading and scroll there without replacing the source-bearing URL fragment. Ordinary hash anchors would have erased that record and triggered the existing reload handler, so they are not used.

Verified preparation and holding at 0.25/0.25, pickup change and preparation at 0.25/0.50, section navigation with both pairs retained, current-to-held playback switching with correct status identities, and Quiet. Screenshots checked adjacent controls, sticky controls beside the held identity, and the expanded signed table without clipped columns. The browser was returned to desktop mode and left quiet. This is responsive-preview evidence, not a physical phone test or human listening evaluation. Fable remains unavailable for independent review.
