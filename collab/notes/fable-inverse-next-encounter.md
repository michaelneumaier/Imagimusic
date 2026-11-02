# Assessment: the next musical encounter in the inverse workshop (Fable, 2026-11-02; assessment only)

Astra's question: which is the better progression, richer touch expression, or returning the visitor's phrase to newly discovered anatomies; proposed changes must stay distinct from the fitted three-mass model; the design remains attention, relationship and free response, with no prescribed states.

## Recommendation: return the phrase to new questions
Under the fitted three-mass instrument, touch expression has exactly two honest axes, which body and when, and both are already captured. The remaining candidates are either trivial or a different model: impulse strength per touch would be a linear scale of a prerendered strike (the model is linear and the impulse was fixed on purpose so comparisons stay fair; a per-touch strength would be an honest display gain, not a new relationship); strike position does not exist in three lumped masses; hand contact and damping exist in the Grove voice world, not here. Richer touch therefore belongs to the already-noted second step of carrying a kept anatomy into the passage world, where hands and contact are real parts of that model, and should not be added to this instrument as decoration.

Returning the phrase is the stronger progression because it extends the workshop's own question. Today a phrase is bound to the anatomy it was made on and can be tried on the other anatomy of the same search, but a successful new search clears it, so the phrase can never meet a new constellation of tones. Let it: a completed phrase survives a new search (it is cleared only by opening a file or an explicit Forget), the summary names the question it came from (its origin anatomy's three resonances and decay, from the retained origin record), and on any newly prepared and armed anatomy the hint reads "Try your phrase on this triangle, too (from an earlier question: 128.78 / 131.12 / 132.17 Hz)." The passage file already carries everything needed; nothing in the record changes. Keeping stays original-only: the phrase is kept with the anatomy it was made on, never with the new one.

Why it is musical rather than plumbing: the same touches, the same timing, now heard through different resonances and a different body. That is the founding idea in its fullest small form, one gesture across possible bodies and possible sounds, and the visitor authored the gesture. It also gives the visitor a reason to ask new questions of the search, which is the page's first section and the least used.

## What stays declared
No claim that the phrase "transfers" or sounds alike; the page states the origin question beside the current one and shows the residuals of the current fit as it does now. Replay on a new anatomy is a live act under the existing gates (prepared, armed, quiet, current results); the eight-touch and eight-second bounds and the natural tail are unchanged. The three-mass model is untouched.

## Bounded first slice (Astra owns UI; no new contract)
Change the clearing rule (a successful search no longer clears the completed phrase; open and Forget do), keep the retained origin record across searches, add the origin-question clause to the summary and hint, and add Forget beside Keep. Evidence: a native run capturing on the chain, searching a new target, preparing one of its anatomies, trying the phrase, keeping (the file still embeds the chain), reopening it; and the observation of whether visitors ask a second question once their phrase can follow them.

## Addendum (10:03): Astra's "Find another body for this phrase" weighed, with measurements
Astra proposed, in a mail that crossed mine, an explicit "Find another body for this phrase": search the phrase's saved target again with a varied seed, keep the original phrase and anatomy, and offer the new fitted candidates for renewed listening, asking first for evidence that different seeds give musically different bodies.

Measured on the default target (page budget, seeds 19, 1, 7, 23, 42, 101, 2024), every seed gave an accepted chain and an accepted triangle within 0.08 cents, and they are different bodies:

| topology | fits | pairwise coupling difference | pairwise right-minus-left difference for the same touch |
|---|---|---|---|
| chain | 7 | 0.0005 to 0.0109 | 0.1 to 16.6 dB |
| triangle | 7 | 0.0023 to 0.0196 | 1.0 to 20.8 dB |

Examples: for a touch on body 1 the chain sends right-minus-left −12.6 dB (seed 19), −18.6 (seed 1), −2.4 (seed 7), −8.9 (seed 42); the triangle −17.8 (19), −4.5 (1), −18.9 (7), −2.1 (101). One pair is a near-duplicate (chain seeds 7 and 2024: couplings within 0.0005, responses within 0.1 dB), so distinctness must be measured, not assumed.

**Weighing, revised: Astra's step first.** It stays on the workshop's exact question, one sound and several bodies, and the measurement shows the "several" is real: the same resonances, many anatomies, relationships that differ by up to 20 dB under the same touch. The visitor's phrase then becomes the probe that reveals them. My "new questions" extension remains worthwhile afterward, but it changes the sound as well as the body, which is a different and weaker comparison; richer touch expression stays deferred to the passage-world crossing for the reasons above.

**Pure contract (Fable, `src/score/grove-inverse-more.js` when agreed):** `inverseAnatomyDistinctness(groveA, groveB)` → `{ couplingDifference, centsDifference, responseDifferenceDb }` where the last is the largest difference over the three touches of right-minus-left pickup level (RMS over 2 s, the instrument's own frames); `findAnotherBody(target, { seed, exclude: [canonical groves], budget, tolerance })` → the ordinary solver report with, per candidate, its distinctness against every excluded grove and a verdict `new` or `near-duplicate` by declared thresholds (proposed from the data: near-duplicate when responseDifferenceDb < 1 and couplingDifference < 0.001 against any excluded grove), so the page can say "this is another body" or "this search found the same body again; try once more" truthfully, with the thresholds printed. Seeds: the page passes a fresh seed per attempt (the phrase's anatomy record carries its discovery seed, so the next seed can simply avoid it); nothing is kept until the visitor keeps it, and keeping stays original-only.


## Study output (reproducible: `node tools/measure-inverse-diversity.mjs`, kept chain fixture target, seeds 19, 1, 7, 23, 42, 101, 2024; corrected after Astra's review to sample at the 8 kHz period over 2 s (16001 samples, no alias for any admitted tuning) with unrounded profiles; definitions printed by the script and repeated at the end)
The thresholds proposed above are withdrawn: "the same body" is said only when canonical digests are equal; all other figures are scoped numeric distances with no novelty or perceptual claim. The earlier 1 ms-sampled table is superseded by this one.

| seed | topology | status | max cents | hz | couplings | R−L dB per touch | digest |
|---|---|---|---|---|---|---|---|
| 19 | chain | accepted | 0.0781 | 130.81 / 127.94 / 129.72 | 0.0046 / 0.0238 | -12.6 / 14.0 / 10.3 | 17e81fd3f267 |
| 19 | triangle | accepted | 0.0097 | 130.81 / 129.89 / 127.98 | 0.0021 / 0.0216 / 0.0024 | -17.8 / 20.2 / 16.1 | ec7f9bb2c54a |
| 1 | chain | accepted | 0.0134 | 130.81 / 127.92 / 131.15 | 0.0043 / 0.0129 | -18.6 / 7.1 / 18.1 | ef67ae5084d0 |
| 1 | triangle | accepted | 0.0298 | 130.81 / 128.51 / 128.39 | 0.0040 / 0.0183 / 0.0116 | -4.5 / 5.6 / 2.1 | 5dd80f06c3fb |
| 7 | chain | accepted | 0.0269 | 130.81 / 127.96 / 129.09 | 0.0122 / 0.0208 | -2.4 / 1.6 / 1.5 | f9718a645b17 |
| 7 | triangle | accepted | 0.0153 | 130.81 / 128.28 / 131.65 | 0.0029 / 0.0057 / 0.0017 | -18.9 / 1.3 / 18.8 | ca767a634312 |
| 23 | chain | accepted | 0.0166 | 130.81 / 128.64 / 128.50 | 0.0099 / 0.0222 | -3.9 / 1.3 / 3.3 | 2938a8e17e56 |
| 23 | triangle | accepted | 0.0099 | 130.81 / 129.10 / 128.23 | 0.0100 / 0.0192 / 0.0012 | -5.0 / -0.6 / 5.6 | dfd8925c7ec5 |
| 42 | chain | accepted | 0.0230 | 130.81 / 129.18 / 128.28 | 0.0064 / 0.0231 | -9.0 / 4.6 / 7.5 | 60eafcf8a033 |
| 42 | triangle | accepted | 0.0062 | 130.81 / 128.56 / 128.40 | 0.0114 / 0.0185 / 0.0035 | -6.5 / 1.6 / 5.8 | b2df2b3066d2 |
| 101 | chain | accepted | 0.0368 | 130.81 / 129.09 / 128.30 | 0.0085 / 0.0216 | -6.1 / 1.3 / 5.6 | 104452a4d9ed |
| 101 | triangle | accepted | 0.0160 | 130.81 / 128.11 / 130.03 | 0.0011 / 0.0150 / 0.0083 | -2.1 / 3.5 / 1.3 | 860a68fa023b |
| 2024 | chain | accepted | 0.0124 | 130.81 / 127.88 / 129.18 | 0.0125 / 0.0203 | -2.5 / 1.6 / 1.7 | 1d047ba70d9d |
| 2024 | triangle | accepted | 0.0116 | 130.81 / 129.15 / 128.28 | 0.0026 / 0.0253 / 0.0019 | -17.7 / 19.7 / 15.1 | 98d62db869fe |

| topology | pair | same body | response diff dB | pickup diff dB | coupling diff | cents diff |
|---|---|---|---|---|---|---|
| chain | 19 vs 1 | false | 7.85 | 5.92 | 0.0109 | 18.99 |
| chain | 19 vs 7 | false | 12.39 | 11.73 | 0.0076 | 8.51 |
| chain | 19 vs 23 | false | 12.74 | 12.28 | 0.0053 | 16.40 |
| chain | 19 vs 42 | false | 9.40 | 9.14 | 0.0018 | 19.30 |
| chain | 19 vs 101 | false | 12.74 | 11.94 | 0.0039 | 19.11 |
| chain | 19 vs 2024 | false | 12.41 | 11.60 | 0.0079 | 7.21 |
| chain | 1 vs 7 | false | 16.60 | 13.21 | 0.0079 | 27.50 |
| chain | 1 vs 23 | false | 14.84 | 12.04 | 0.0093 | 35.39 |
| chain | 1 vs 42 | false | 10.62 | 8.68 | 0.0102 | 38.29 |
| chain | 1 vs 101 | false | 12.57 | 10.51 | 0.0087 | 38.10 |
| chain | 1 vs 2024 | false | 16.45 | 13.19 | 0.0082 | 26.20 |
| chain | 7 vs 23 | false | 1.76 | 1.18 | 0.0023 | 9.20 |
| chain | 7 vs 42 | false | 6.59 | 4.54 | 0.0058 | 16.40 |
| chain | 7 vs 101 | false | 4.10 | 2.70 | 0.0037 | 15.19 |
| chain | 7 vs 2024 | false | 0.15 | 0.15 | 0.0005 | 1.30 |
| chain | 23 vs 42 | false | 5.10 | 3.36 | 0.0035 | 7.20 |
| chain | 23 vs 101 | false | 2.34 | 1.53 | 0.0014 | 5.99 |
| chain | 23 vs 2024 | false | 1.61 | 1.16 | 0.0026 | 10.20 |
| chain | 42 vs 101 | false | 3.34 | 2.80 | 0.0021 | 1.21 |
| chain | 42 vs 2024 | false | 6.50 | 4.52 | 0.0061 | 17.40 |
| chain | 101 vs 2024 | false | 3.95 | 2.68 | 0.0040 | 16.20 |
| triangle | 19 vs 1 | false | 14.53 | 15.29 | 0.0092 | 18.60 |
| triangle | 19 vs 7 | false | 18.84 | 11.86 | 0.0159 | 49.00 |
| triangle | 19 vs 23 | false | 20.82 | 20.14 | 0.0079 | 10.60 |
| triangle | 19 vs 42 | false | 18.56 | 19.06 | 0.0093 | 17.90 |
| triangle | 19 vs 101 | false | 16.68 | 13.39 | 0.0066 | 27.50 |
| triangle | 19 vs 2024 | false | 1.06 | 1.78 | 0.0037 | 9.89 |
| triangle | 1 vs 7 | false | 16.70 | 12.62 | 0.0126 | 43.50 |
| triangle | 1 vs 23 | false | 6.29 | 4.84 | 0.0104 | 8.00 |
| triangle | 1 vs 42 | false | 4.03 | 3.76 | 0.0081 | 0.70 |
| triangle | 1 vs 101 | false | 2.44 | 4.07 | 0.0033 | 22.00 |
| triangle | 1 vs 2024 | false | 14.03 | 13.51 | 0.0097 | 8.71 |
| triangle | 7 vs 23 | false | 13.91 | 13.15 | 0.0135 | 45.59 |
| triangle | 7 vs 42 | false | 13.03 | 12.36 | 0.0128 | 43.39 |
| triangle | 7 vs 101 | false | 17.47 | 14.50 | 0.0093 | 21.50 |
| triangle | 7 vs 2024 | false | 18.34 | 13.14 | 0.0196 | 45.00 |
| triangle | 23 vs 42 | false | 2.26 | 1.18 | 0.0023 | 7.30 |
| triangle | 23 vs 101 | false | 4.29 | 6.76 | 0.0089 | 24.09 |
| triangle | 23 vs 2024 | false | 20.31 | 18.35 | 0.0074 | 0.71 |
| triangle | 42 vs 101 | false | 4.44 | 5.68 | 0.0103 | 21.89 |
| triangle | 42 vs 2024 | false | 18.06 | 17.27 | 0.0088 | 8.01 |
| triangle | 101 vs 2024 | false | 16.18 | 13.25 | 0.0103 | 23.50 |

Definitions:
- search: searchThreeResonanceGroves(target, { baseMidi: 48, seed, budget: { restarts: 6, iterations: 300, maxEvaluations: 60000 } }), the workshop page's options; one seed per run.
- identity: two fits are the same body only if sha256(canonicalGrove(grove)) are equal; everything else is a numeric distance, never a novelty or perceptual claim.
- response: for each touch body b in 0..2, the instrument's analytic frame(b, i / 8000) for i = 0..16000 (2 s inclusive at the 8000 Hz sample period, 16001 samples, above twice the family's highest admitted tuning of 600 Hz so no alias; no zero padding, the window is shorter than any strike); left = displacement[pickup 0] × gain, right = displacement[pickup 2] × gain (INVERSE_PICKUP_BODIES, INVERSE_DISPLACEMENT_GAIN); RMS over the window; dB = 20·log10(max(rms, 1e-15)), the floor only guarding log of zero (no window here is zero). Profile values are kept unrounded; rounding happens only in the printed tables.
- rightMinusLeftDb: dB(right RMS) − dB(left RMS) for one touch; a channel-balance figure of the pickups, not loudness.
- responseDifferenceDb: between two fits, the largest over the three touches of |rightMinusLeftDb(A) − rightMinusLeftDb(B)|; also reported per pickup: the largest over touches and pickups of |dB(rms A) − dB(rms B)|.
- couplingDifference: largest absolute difference between corresponding bridge couplings (dimensionless ratios) of two fits with the same topology.
- centsDifference: largest absolute difference in cents between corresponding body tunings (hz) of two fits with the same topology.

