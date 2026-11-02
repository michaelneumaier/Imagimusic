# Assessment: visitor-controlled listening level for the inverse workshop (Fable, 2026-11-02; assessment only, Astra implements)

## Bound, verified
Per-strike peak bound 0.0159156203 (impulse × gain over the lightest mass and the lowest damped frequency at the family bounds); eight coherent strikes 0.1273249623; at ×4 0.5092998494, which is −5.9 dBFS; at ×6 0.7639, −2.3 dBFS; eight coherent strikes reach full scale at ×7.854. These are digital-amplitude bounds, not sound pressure or device volume.

## What the default candidates actually produce (measured, 0..4 s, pickups × 8)
| anatomy, touch | single-strike peak | % of bound | 4 s stereo RMS | at ×4: peak / RMS |
|---|---|---|---|---|
| chain 1 | 0.00485 (−46.3 dBFS) | 30 % | −57.8 dBFS | −34.2 / −45.7 |
| chain 2 | 0.00406 (−47.8) | 26 % | −61.6 | −35.8 / −49.5 |
| chain 3 | 0.00485 (−46.3) | 30 % | −59.9 | −34.2 / −47.8 |
| triangle 1 | 0.00485 (−46.3) | 30 % | −57.7 | −34.2 / −45.7 |
| triangle 2 | 0.00379 (−48.4) | 24 % | −62.3 | −36.4 / −50.2 |
| triangle 3 | 0.00491 (−46.2) | 31 % | −59.4 | −34.1 / −47.3 |

So the bound is a worst case about three times the actual single-strike peak, and the actual eight-strike peak would stay well under it unless strikes land in phase. At ×4 a single strike peaks near −34 dBFS with an RMS near −46 to −50 dBFS over four seconds, which is still a small signal by any ordinary digital standard; whether it is comfortably audible on a phone is a device question nobody here has heard, and the page should not call it either loud or quiet. For scale: the inverse-network listening study used 18 dB (×7.94), which sits at the coherent eight-strike bound.

## Recommendation on the range
Keep the hard rule that eight coherent strikes cannot exceed full scale at the top of the range: that admits any cap up to ×7.85. ×4 (−5.9 dBFS worst case, ×1.3 the default-4 typical peak at −34 dBFS) is defensible and conservative; ×6 (−2.3 dBFS worst case) would give visitors 3.5 dB more without crossing the rule. Either is honest if the caption states the worst-case peak at the chosen level ("eight overlapping strikes cannot exceed −5.9 dBFS at this level"), a sentence the page can compute and make truthfully. Default 1, no automatic increase, never normalised per candidate: agreed.

## UX points
- One shared gain after the eight-strike mixer and before the destination, so the bound scales linearly with the slider and the per-candidate PCM stays untouched.
- Ramps: before each change call cancelScheduledValues, then setValueAtTime(the held analytic value) at the current time, then linearRampToValueAtTime over 30 ms; without the held set-value a ramp from a stale automation point jumps.
- Level 0 is "muted monitoring": the model and the ring count continue, Quiet stays the only way to stop; label it so.
- Persist the level in page memory only, not storage, so a return never surprises with a loud level; keep it across candidate and search changes within the visit, as proposed, for a fair comparison.
- A native range input with step 0.1, labelled "Listening level ×1.0", keyboard-operable; the caption says it is the listener's choice and not part of the model, and names the worst-case peak at the current level.
- Where it lives: beside Start listening and Quiet above the picture, so the three listening controls stay together.
Evidence before it ships: the ramp tested against a change mid-strike (no step in the output), the worst-case sentence checked against the bound for the range ends, and Michael's device impression, which is still the only loudness evidence anyone can give.
