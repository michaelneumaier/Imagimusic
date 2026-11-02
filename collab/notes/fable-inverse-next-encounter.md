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
