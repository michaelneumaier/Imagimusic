# Repeated-rule saturation probe (Fable, 2026-11-01)

Astra asked, before any wider invitation, where repeated application of the bridge-activity rule stops producing contrast. This note reports measurements only; a metric difference is not appeal, and nothing here says what is audible.

## Method
`coupling ← clamp(coupling · (1 + k · share))` with k = 0.5, applied up to 14 times per gesture, the same gesture re-measured on each adapted structure (the study's protocol). Three gestures on each curated grove at 16 kHz: the authored individuality phrase (11.03 s, 5 strikes, 1 contact), the invitation (20.02 s, 6 strikes, 3 contacts), and a single free strike (4.03 s). Per step: couplings, bridges at the bound (0.04), the low-mode beat rates, and two rendered-difference measures of the same gesture: `step contrast` = rms(render_n − render_{n−1}) / rms(render_0) and `from original` = rms(render_n − render_0) / rms(render_0), in dB. Output gain stayed 0.45 at every step on every seed, so the strict adapter would accept every pair. Data: `renders/attend-study/saturation.json`; script in Fable's scratchpad.

## Where the structure stops changing
| grove | gesture | favoured bridge at the bound after | all bridges at the bound (no further change) |
|---|---|---|---|
| 3 (three bridges) | phrase / invitation / strike | 6 / 7 / 5 steps | not within 14 (the two other bridges keep creeping: 0.0072/0.024 at step 14 for the phrase) |
| 7 (two bridges) | phrase / invitation / strike | 6 / 6 / 8 steps | 13 / 13 / 10 steps: the rule then returns the identical grove |
| 11 (three bridges) | phrase / invitation / strike | 7 / 8 / 7 steps | not within 14; two bridges at the bound from step 12–14 |

After three steps the largest ratio of any bridge to its source value is 2.05–2.42 on groves 3 and 7 (3: phrase 2.12, invitation 2.05, strike 2.42; 7: phrase 2.22, invitation 2.23, strike 2.41) and up to 1.94 on grove 11 (Astra's figures from the JSON, confirmed). By the time the favoured bridge reaches the bound it is 4.7× the source on grove 3 and 3.5–4× on the others. After that point that bridge is set by the bound, not by the gesture; the other bridges keep changing until they reach it too.

## Where the rendered contrast goes
- Between consecutive structures the rendered difference of the same gesture stays large until the structure actually freezes: −6 to 0 dB relative to the original's rms on groves 3 and 7 (the difference signal is comparable to the signal itself, because the beat rates shift and the two renders drift out of phase), and about −6 dB (invitation) to −11 dB (single strike) on grove 11. It collapses only when every bridge is at the bound (grove 7, −300 dB, identical render). So "contrast disappears" is a structural event, not a gradual fade, at this k.
- The single strike produces the smallest rendered change per step on grove 11 (−11 dB) and reaches the bound later on grove 7 (8 steps): a shorter, simpler gesture moves the structure less per application on some groves and not on others (grove 3: 5 steps).
- The low-mode beat rates move far before the bound is reached. Grove 3's slowest low-mode beat goes 1.03 → 2.18 Hz by step 3 and 4.8 Hz at the bound (step 6); grove 7's 0.41 → 3.3 Hz by step 3 and 5.6 Hz at the bound; grove 11's three rates go 2.5/6.2/3.6 → 3.2/9.0/5.8 Hz by step 3 and 4.9/18/13 Hz at the bound. Beyond roughly 10–15 Hz these are no longer slow beats in the sense the pages describe; what that is like to hear is not measured here.

## What this suggests for the study design (no rule change proposed)
- A bounded number of applications per encounter, three or fewer at k = 0.5, keeps every bridge within 2.42× its source (range 1.9–2.4 across the gestures and groves measured) and the beat rates within a few hertz of the original; that is the regime the current listening pairs cover.
- Beyond five to eight applications the favoured bridge sits at the bound on every grove and gesture, after which further applications change only the other bridges. If the rule is ever made cumulative across sessions, this is the saturation horizon to disclose.
- Whether the one-step or three-step change is heard as the same instrument answering, or as a different instrument, is the open listening question; nothing in these numbers answers it.
