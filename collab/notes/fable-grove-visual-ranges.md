# Study: the Grove's visual envelope ranges after one touch (Fable, 2026-11-02; numbers and relationships only, no perceptual conclusion, no threshold recommendation)

Astra's question: for seeds 3, 7 and 11, original voice and the default partials voice, one admitted touch on body 2 at velocity 0.5 and 1, what are the numeric ranges of the visual envelope over the first 4 s and of the display values `applyGroveScene` derives from it. Reproducible: `node tools/measure-grove-visual-ranges.mjs` (reads the page's own `createGroveSession` and `createGroveVoiceSession`, checks the strike receipt is admitted, samples `visual(time).envelope` every 50 ms, and applies the scene's mapping with the scene's own `haloOpacity`; edits nothing). Two different quantities, corrected after Astra's review: the original voice's envelope is the full three-mode network envelope (`grovePerformanceFrame`), the partials voice's is that voice's declared low-band envelope (`groveVoiceEnvelope`); they are compared only as what each page draws. Astra's native diagnostic reading for Grove 3, original, body 2, v 0.5 at 1 s, [0.014895, 0.060615, 0.020975], equals this table's row (0.0149 / 0.0606 / 0.0210) and is asserted in the test.

## Relationships, read from the table below
All peaks and times below are sampled maxima on the 50 ms grid, not exact extrema (Astra's review). The partials ratio holds for these sampled default-configuration cases, not for arbitrary voices.
- **Struck-body peak level** (at the touch): original voice 0.098 (v 0.5) and 0.196 (v 1) for seeds 3 and 7, but 0.042 and 0.084 for seed 11; the default partials voice gives 0.46 × the original in each of these sampled cases (0.045 / 0.090 for seeds 3 and 7; 0.019 / 0.039 for seed 11). Velocity scales the envelope linearly (v 1 is exactly 2 × v 0.5), as the model is linear.
- **Neighbours' peak** comes 0.1 to 0.2 s after the touch: 0.23 to 0.42 of the struck body's peak for seeds 3 and 7 (the far body in seed 7 is the strongest neighbour, 0.41), and about 1.0 for seed 11, whose energy spreads to all three bodies within 0.2 s so that no body stands out after the first tenth of a second.
- **Decay**: by 1 s the struck body sits at roughly 0.6 of its peak for seeds 3 and 7 (0.06 / 0.12 original) and the neighbours at 0.015 to 0.05; by 2 s at 0.03 to 0.08 struck and 0.003 to 0.016 neighbours; by 4 s everything is below 0.04.
- **Display values at the peaks** (caps in brackets): form widening 0.014 to 0.12 [0.2] (the cap is never reached by one touch; the struck body at v 1 original reaches 0.12, neighbours 0.014 to 0.05); shell emissive 0.07 to 0.43 [rest 0.025, cap 0.725] (neighbours 0.07 to 0.19); core emissive 0.17 to 0.70 [rest 0.1, cap 1.3]; halo opacity with the baseline gain 2: struck 0.23 to 0.54 [rest 0.15, cap 0.80], neighbours 0.17 to 0.32, so a neighbour's halo rises 0.02 to 0.17 above rest; with the opt-in Follow-the-ring gain 10: the struck body saturates at 0.80 for seeds 3 and 7 at either velocity (and seed 11 at v 1), neighbours 0.26 to 0.80.
- **Seed 11 is the outlier in both directions**: the lowest struck peak (0.042 at v 0.5) and the most even spread (neighbours equal to the struck body), so at the baseline gain all three bodies move together at a low level (halo 0.23 at v 0.5).
- **Partials voice**: every display value sits lower than the original's because the envelope is 0.46 ×; at v 0.5 the struck body's widening is 0.027 and its baseline halo 0.24.

## Table (seed, voice, velocity, body; peak level and its time; level at 0.5, 1, 2 and 4 s; display values at the peak)

| seed | voice | v | body | peak level | at s | level 0.5 s | 1 s | 2 s | 4 s | pulse | shell | core | halo base | halo follow |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 | original | 0.5 | 1 | 0.0230 | 0.20 | 0.0160 | 0.0149 | 0.0026 | 0.0022 | 0.014 | 0.071 | 0.169 | 0.196 | 0.380 |
| 3 | original | 0.5 | 2 (struck) | 0.0980 | 0.00 | 0.0774 | 0.0606 | 0.0424 | 0.0182 | 0.059 | 0.221 | 0.394 | 0.346 | 0.800 |
| 3 | original | 0.5 | 3 | 0.0276 | 0.20 | 0.0144 | 0.0210 | 0.0025 | 0.0022 | 0.017 | 0.080 | 0.183 | 0.205 | 0.426 |
| 3 | original | 1 | 1 | 0.0459 | 0.20 | 0.0319 | 0.0298 | 0.0053 | 0.0045 | 0.028 | 0.117 | 0.238 | 0.242 | 0.609 |
| 3 | original | 1 | 2 (struck) | 0.1960 | 0.00 | 0.1547 | 0.1212 | 0.0847 | 0.0364 | 0.118 | 0.417 | 0.688 | 0.542 | 0.800 |
| 3 | original | 1 | 3 | 0.0552 | 0.20 | 0.0287 | 0.0419 | 0.0051 | 0.0043 | 0.033 | 0.135 | 0.266 | 0.260 | 0.702 |
| 3 | partials | 0.5 | 1 | 0.0106 | 0.20 | 0.0074 | 0.0069 | 0.0012 | 0.0010 | 0.006 | 0.046 | 0.132 | 0.171 | 0.256 |
| 3 | partials | 0.5 | 2 (struck) | 0.0452 | 0.00 | 0.0357 | 0.0280 | 0.0195 | 0.0084 | 0.027 | 0.115 | 0.236 | 0.240 | 0.602 |
| 3 | partials | 0.5 | 3 | 0.0128 | 0.20 | 0.0066 | 0.0097 | 0.0012 | 0.0010 | 0.008 | 0.051 | 0.138 | 0.176 | 0.278 |
| 3 | partials | 1 | 1 | 0.0212 | 0.20 | 0.0147 | 0.0138 | 0.0024 | 0.0020 | 0.013 | 0.067 | 0.164 | 0.192 | 0.362 |
| 3 | partials | 1 | 2 (struck) | 0.0904 | 0.00 | 0.0714 | 0.0559 | 0.0391 | 0.0168 | 0.054 | 0.206 | 0.371 | 0.331 | 0.800 |
| 3 | partials | 1 | 3 | 0.0255 | 0.20 | 0.0133 | 0.0194 | 0.0024 | 0.0020 | 0.015 | 0.076 | 0.177 | 0.201 | 0.405 |
| 7 | original | 0.5 | 1 | 0.0237 | 0.20 | 0.0095 | 0.0085 | 0.0063 | 0.0015 | 0.014 | 0.072 | 0.171 | 0.197 | 0.387 |
| 7 | original | 0.5 | 2 (struck) | 0.1003 | 0.00 | 0.0671 | 0.0471 | 0.0278 | 0.0076 | 0.060 | 0.226 | 0.401 | 0.351 | 0.800 |
| 7 | original | 0.5 | 3 | 0.0411 | 0.20 | 0.0302 | 0.0267 | 0.0078 | 0.0043 | 0.025 | 0.107 | 0.223 | 0.232 | 0.561 |
| 7 | original | 1 | 1 | 0.0474 | 0.20 | 0.0189 | 0.0171 | 0.0127 | 0.0030 | 0.028 | 0.120 | 0.242 | 0.245 | 0.624 |
| 7 | original | 1 | 2 (struck) | 0.2006 | 0.00 | 0.1341 | 0.0942 | 0.0557 | 0.0153 | 0.120 | 0.426 | 0.702 | 0.551 | 0.800 |
| 7 | original | 1 | 3 | 0.0822 | 0.20 | 0.0605 | 0.0534 | 0.0157 | 0.0086 | 0.049 | 0.189 | 0.347 | 0.314 | 0.800 |
| 7 | partials | 0.5 | 1 | 0.0109 | 0.20 | 0.0044 | 0.0039 | 0.0029 | 0.0007 | 0.007 | 0.047 | 0.133 | 0.172 | 0.259 |
| 7 | partials | 0.5 | 2 (struck) | 0.0463 | 0.00 | 0.0310 | 0.0217 | 0.0129 | 0.0035 | 0.028 | 0.118 | 0.239 | 0.243 | 0.613 |
| 7 | partials | 0.5 | 3 | 0.0189 | 0.20 | 0.0139 | 0.0123 | 0.0036 | 0.0020 | 0.011 | 0.063 | 0.157 | 0.188 | 0.339 |
| 7 | partials | 1 | 1 | 0.0219 | 0.20 | 0.0087 | 0.0079 | 0.0058 | 0.0014 | 0.013 | 0.069 | 0.166 | 0.194 | 0.369 |
| 7 | partials | 1 | 2 (struck) | 0.0925 | 0.00 | 0.0619 | 0.0435 | 0.0257 | 0.0071 | 0.056 | 0.210 | 0.378 | 0.335 | 0.800 |
| 7 | partials | 1 | 3 | 0.0379 | 0.20 | 0.0278 | 0.0246 | 0.0072 | 0.0040 | 0.023 | 0.101 | 0.214 | 0.226 | 0.529 |
| 11 | original | 0.5 | 1 | 0.0401 | 0.20 | 0.0133 | 0.0188 | 0.0156 | 0.0006 | 0.024 | 0.105 | 0.220 | 0.230 | 0.551 |
| 11 | original | 0.5 | 2 (struck) | 0.0418 | 0.00 | 0.0200 | 0.0182 | 0.0018 | 0.0042 | 0.025 | 0.109 | 0.225 | 0.234 | 0.568 |
| 11 | original | 0.5 | 3 | 0.0419 | 0.10 | 0.0379 | 0.0043 | 0.0084 | 0.0052 | 0.025 | 0.109 | 0.226 | 0.234 | 0.569 |
| 11 | original | 1 | 1 | 0.0803 | 0.20 | 0.0265 | 0.0376 | 0.0311 | 0.0011 | 0.048 | 0.186 | 0.341 | 0.311 | 0.800 |
| 11 | original | 1 | 2 (struck) | 0.0836 | 0.00 | 0.0399 | 0.0365 | 0.0036 | 0.0085 | 0.050 | 0.192 | 0.351 | 0.317 | 0.800 |
| 11 | original | 1 | 3 | 0.0838 | 0.10 | 0.0758 | 0.0086 | 0.0168 | 0.0104 | 0.050 | 0.193 | 0.351 | 0.318 | 0.800 |
| 11 | partials | 0.5 | 1 | 0.0186 | 0.20 | 0.0061 | 0.0087 | 0.0072 | 0.0002 | 0.011 | 0.062 | 0.156 | 0.187 | 0.336 |
| 11 | partials | 0.5 | 2 (struck) | 0.0193 | 0.00 | 0.0093 | 0.0084 | 0.0008 | 0.0020 | 0.012 | 0.064 | 0.158 | 0.189 | 0.343 |
| 11 | partials | 0.5 | 3 | 0.0194 | 0.10 | 0.0175 | 0.0021 | 0.0038 | 0.0022 | 0.012 | 0.064 | 0.158 | 0.189 | 0.344 |
| 11 | partials | 1 | 1 | 0.0371 | 0.20 | 0.0122 | 0.0174 | 0.0145 | 0.0004 | 0.022 | 0.099 | 0.211 | 0.224 | 0.521 |
| 11 | partials | 1 | 2 (struck) | 0.0387 | 0.00 | 0.0185 | 0.0169 | 0.0015 | 0.0041 | 0.023 | 0.102 | 0.216 | 0.227 | 0.537 |
| 11 | partials | 1 | 3 | 0.0387 | 0.10 | 0.0351 | 0.0041 | 0.0075 | 0.0045 | 0.023 | 0.102 | 0.216 | 0.227 | 0.537 |

Mapping:
- pulse: form widening factor = min(0.2, level × 0.6)
- shell: shell emissive = 0.025 + min(0.7, level × 2)
- core: core emissive = 0.1 + min(1.2, level × 3)
- haloBaseline: halo opacity = 0.15 + min(0.65, level × 2) (Follow the ring off)
- haloFollow: halo opacity = 0.15 + min(0.65, level × 10) (Follow the ring on, opt-in)
- level: the session's visual(time).envelope[body] (declared low-band envelope), sampled every 50 ms from 0 to 4 s after one strike at frame 0


## Addendum: Astra's diagnostic candidate ring mapping, checked (10:45)
Candidate (diagnostic only, not a product gain): halo opacity = 0.15 + 0.65 · L / (L + 0.1). Checks: rest 0.15 at L = 0; the quoted values reproduce (0.03 → 0.300, 0.098 → 0.472, 0.196 → 0.580); monotonic with asymptote 0.80 and no cap at finite levels; initial slope 6.5 (between the baseline gain 2 and the opt-in gain 10); half-saturation at L = 0.1, so a struck body on seeds 3 and 7 at v 0.5 sits at the knee; above the baseline for every one-touch level, since the two cross at L = 0.225; the opt-in gain caps at L = 0.065, which the struck body exceeds on seeds 3 and 7 for the original voice at either velocity and the partials voice at v 1, but not for the partials voice at v 0.5 (peaks 0.045 and 0.046; corrected after Astra's review). At the study's sampled peaks (each body's own sampled peak, which occur at different times, so the columns are peak-to-peak ratios of excess above the 0.15 rest, not a simultaneous visible contrast and not a perceptual quantity):

| seed | voice | v | struck peak L | neighbour peak L | baseline struck / nb | opt-in | candidate | peak-to-peak ratio, baseline | opt-in | candidate |
|---|---|---|---|---|---|---|---|---|---|---|
| 3 | original | 0.5 | 0.098 | 0.028 | 0.346 / 0.205 | 0.800 / 0.426 | 0.472 / 0.291 | 3.55 | 2.35 | 2.29 |
| 3 | original | 1 | 0.196 | 0.055 | 0.542 / 0.260 | 0.800 / 0.702 | 0.580 / 0.381 | 3.55 | 1.18 | 1.86 |
| 3 | partials | 0.5 | 0.045 | 0.013 | 0.240 / 0.176 | 0.602 / 0.278 | 0.352 / 0.224 | 3.55 | 3.55 | 2.75 |
| 3 | partials | 1 | 0.090 | 0.026 | 0.331 / 0.201 | 0.800 / 0.405 | 0.459 / 0.282 | 3.55 | 2.55 | 2.34 |
| 7 | original | 0.5 | 0.100 | 0.041 | 0.351 / 0.232 | 0.800 / 0.561 | 0.475 / 0.339 | 2.44 | 1.58 | 1.72 |
| 7 | original | 1 | 0.201 | 0.082 | 0.551 / 0.314 | 0.800 / 0.800 | 0.584 / 0.443 | 2.44 | 1.00 | 1.48 |
| 7 | partials | 0.5 | 0.046 | 0.019 | 0.243 / 0.188 | 0.613 / 0.339 | 0.356 / 0.254 | 2.44 | 2.44 | 1.99 |
| 7 | partials | 1 | 0.093 | 0.038 | 0.335 / 0.226 | 0.800 / 0.529 | 0.462 / 0.329 | 2.44 | 1.72 | 1.75 |
| 11 | original | 0.5 | 0.042 | 0.042 | 0.234 / 0.234 | 0.568 / 0.569 | 0.342 / 0.342 | 1.00 | 1.00 | 1.00 |
| 11 | original | 1 | 0.084 | 0.084 | 0.317 / 0.318 | 0.800 / 0.800 | 0.446 / 0.446 | 1.00 | 1.00 | 1.00 |

Readings, numeric only: the baseline is linear, so its peak-to-peak ratio equals the level ratio; the candidate lifts the neighbour's peak more than the struck body's and lowers the ratio to 1.5 to 2.3 on seeds 3 and 7; the opt-in gain lifts everything most but collapses the ratio to 1.0 to 1.2 at v 1 by capping; on seed 11 every mapping gives 1.0 because the levels are equal. Two scope cautions: the knee 0.1 is in absolute envelope units while the two voices' envelopes are different quantities (the partials voice 0.46 × in these cases), so one constant compresses the original voice more than the partials voice; and compression trades the struck-to-neighbour contrast for the neighbour's rise above rest, which is the relationship criterion itself, so a frozen comparison should weigh both figures, not one. Nothing here approves a product gain.
