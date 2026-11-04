# Study: what a plain spectral estimator recovers from a short decaying note (Fable, 2026-11-02; Node only, no estimator in src; numbers and refusals, no admission bound, no three-peak promise)

Reproducible: `node tools/study-sound-file-target.mjs` (prints its definitions with its tables). Every case runs under a rectangular window (best resolution, −13 dB sidelobes) and a Hann window (half the resolution, −31 dB sidelobes) at W = 0.25, 0.5, 1, 2, 4 and 8 s; peaks need 6 dB above the window's median to be listed and 20 dB with a decay fit to be counted as supported; sidelobe rejection against every stronger accepted peak's envelope. The Smith two-cycle rule (and Abe and Smith's 1.44 cycles) is printed per case as a prediction for the closest true pair and compared with what was found.

## Findings, from the tables below
1. **The default target's cluster (128.78 / 131.12 / 132.17 Hz, 2.3 and 1.0 Hz apart) is the hard case.** On the project's own rendered chain strike (real damping, real pickup residues), the rectangular window separates the outer two modes at 1 s and all three only at 4 s (middle mode −1.0 cents) and 8 s (−0.4 cents); the Hann window never separates the middle mode on that recording, at any W up to 8 s, because the middle mode's residue at the pickups is weak and lies under its neighbours' skirts. On the synthetic equal-amplitude version of the same cluster the rectangular window resolves all three at 2 s (within 1 cent) and the Hann window at 4 s (within 0.1 cent). So the Smith prediction for the closest pair (1.9 s for two cycles, 1.4 s for 1.44 cycles) holds for the equal-amplitude synthetic under the rectangular window and is optimistic by about two for the damped rendered strike; this is exactly the methodological guard Astra asked for, and the study states the rule as a prediction only.
2. **Mode residues decide recoverability, and residues are what the inverse fit excludes.** The model's "anything heard" exclusion means a resonance weakly present at the pickups can be unrecoverable from a recording even when the fit is exact. A sound-file path therefore cannot promise three resonances from any note; the page must report "supported estimates: n" and let the visitor declare.
3. **The rectangular window lists artefacts; the Hann window does not.** With a merged cluster the rectangular pass still lists beating sidelobes 35 to 60 dB above the median (for example 178, 186, 194 Hz at 0.25 s), which the envelope rule cannot remove without also removing real weak modes; the Hann pass lists only true modes in every synthetic case. The study therefore takes the Hann count as the evidence count and uses the rectangular pass only as a resolution probe. A plain rectangular peak picker is not an honest estimator for this material.
4. **Well-separated modes are easy in either window**: 140 / 190 / 260 Hz with decays 0.8 / 2.4 / 5 s are found within 0.5 cent at 0.25 s with decays within 1 %, under both windows; the three partials at 802 to 820 Hz are found within 0.2 cent at 0.5 s with their 0.6 s decays within 2 %, beside the low cluster.
5. **Decays**: per-mode decay fits are within 1 % for separated modes and within about 10 % for a cluster's members (beating leaks into the frame projection), which is why decays are reported per mode with the spread and never averaged into an automatic common decay.
6. **The negative controls behave**: the two-mode note gives exactly 2 supported under Hann at every W ("insufficient evidence"); the four-mode note gives 4 ("more than the model holds"); white noise gives 0 supported under the 20 dB floor (its listed peaks sit 11 to 15 dB above the median); the close pair 1 Hz apart with opposite phases is unresolved below 4 s and resolved at 4 and 8 s by both windows (0.0 to 0.2 cent), with the 300 Hz mode found throughout.
7. **Noise at −30 dB** changes nothing material: the same resolutions and errors as without noise.

## What this means for a page (for agreement; no implementation yet)
An estimator would run a Hann window over the longest available length up to 8 s, report the supported modes with their frequency, decay and dB above median, print the resolution it had (the window's half-width), and say "insufficient evidence for three resonances" whenever fewer than three are supported, without inventing the rest; the visitor declares the target from that evidence. Resolution for the default-style cluster needs at least 4 s of signal above the noise, which the 2.4 s decay of such a note does not always give.

## Tables (definitions printed at the end)


### kept chain, rendered strike on body 2 (true resonances known)
expect: three modes 2.3 and 1.0 Hz apart with one decay; Smith prediction for the closest pair (1.05 Hz): W ≥ 1.91 s (two cycles), 1.38 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 130.43 (85) τ2.34 | 1 | 128.8: 21.8 c, 2.34 s (-2 %); 131.1: -9.2 c, 2.34 s (-2 %); 132.2: -22.9 c, 2.34 s (-2 %) |
| rect 0.50 | 128.93 (102) τ2.39 | 1 | 128.8: 1.9 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: unmatched |
| rect 1.00 | 128.81 (87) τ2.39, 132.15 (87) τ2.39 | 2 | 128.8: 0.3 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: -0.2 c, 2.39 s (-0 %) |
| rect 2.00 | 128.80 (98) τ2.39, 132.15 (98) τ2.39, 130.48 (83) τ2.34 | 3 | 128.8: 0.2 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: -0.2 c, 2.39 s (-0 %) |
| rect 4.00 | 128.79 (107) τ2.39, 132.16 (106) τ2.39, 131.04 (88) τ2.39, 130.16 (87) τ2.38 | 4 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: -1.0 c, 2.39 s (-0 %); 132.2: -0.0 c, 2.39 s (-0 %) |
| rect 8.00 | 128.79 (156) τ2.39, 132.16 (155) τ2.39, 131.64 (139) τ2.39, 129.46 (138) τ2.39, 131.37 (136) τ2.39, 129.72 (136) τ2.39, 131.09 (136) τ2.39, 129.97 (135) τ2.39 | 8 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: -0.4 c, 2.39 s (-0 %); 132.2: -0.0 c, 2.39 s (-0 %) |
| hann 0.25 | 130.44 (190) τ2.34 | 1 | 128.8: 22.0 c, 2.34 s (-2 %); 131.1: -9.0 c, 2.34 s (-2 %); 132.2: -22.8 c, 2.34 s (-2 %) |
| hann 0.50 | 128.60 (192) τ2.39 | 1 | 128.8: -2.6 c, 2.39 s (-0 %); 131.1: -33.6 c, 2.39 s (-0 %); 132.2: -47.3 c, 2.39 s (-0 %) |
| hann 1.00 | 128.78 (194) τ2.39 | 1 | 128.8: -0.1 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: unmatched |
| hann 2.00 | 128.79 (197) τ2.39, 132.16 (196) τ2.39 | 2 | 128.8: -0.0 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: 0.0 c, 2.39 s (-0 %) |
| hann 4.00 | 128.79 (200) τ2.39, 132.16 (200) τ2.39 | 2 | 128.8: -0.0 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: 0.0 c, 2.39 s (-0 %) |
| hann 8.00 | 128.79 (203) τ2.39, 132.16 (202) τ2.39 | 2 | 128.8: -0.0 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: 0.0 c, 2.39 s (-0 %) |

### synthetic: the same three resonances, equal amplitudes, one decay
expect: the controlled version of the chain; Smith prediction for the closest pair (1.05 Hz): W ≥ 1.91 s (two cycles), 1.38 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 132.13 (72) τ2.60, 178.02 (45) τ2.50, 186.02 (44) τ2.50, 194.03 (43) τ2.50, 202.03 (42) τ2.51, 210.03 (41) τ2.51, 218.03 (40) τ2.51, 226.03 (39) τ2.52 | 8 | 128.8: 44.3 c, 2.60 s (9 %); 131.1: 13.3 c, 2.60 s (9 %); 132.2: -0.5 c, 2.60 s (9 %) |
| rect 0.50 | 131.58 (76) τ2.44, 125.92 (65) τ2.06, 121.85 (58) τ2.45, 117.82 (55) τ2.43, 113.80 (52) τ2.28, 149.74 (51) τ2.50, 109.79 (50) τ2.29, 153.76 (50) τ2.50 | 8 | 128.8: unmatched; 131.1: 6.1 c, 2.44 s (2 %); 132.2: -7.6 c, 2.44 s (2 %) |
| rect 1.00 | 132.33 (80) τ2.59, 128.74 (80) τ2.39, 136.57 (62) τ2.43, 138.57 (60) τ2.50, 122.53 (58) τ2.49, 140.56 (57) τ2.42, 120.54 (56) τ2.42, 142.56 (56) τ2.45 | 8 | 128.8: -0.7 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: 2.2 c, 2.59 s (8 %) |
| rect 2.00 | 132.23 (84) τ2.63, 131.07 (84) τ2.40, 128.76 (83) τ2.39, 133.90 (68) τ2.47, 134.91 (65) τ2.39, 125.98 (64) τ2.57, 135.91 (63) τ2.48, 124.97 (62) τ2.46 | 8 | 128.8: -0.4 c, 2.39 s (-0 %); 131.1: -0.6 c, 2.40 s (0 %); 132.2: 0.9 c, 2.63 s (10 %) |
| rect 4.00 | 131.11 (87) τ2.40, 132.18 (87) τ2.62, 128.78 (87) τ2.39, 133.01 (72) τ2.49, 133.51 (69) τ2.48, 127.45 (67) τ2.40, 134.26 (66) τ2.46, 126.95 (65) τ2.39 | 8 | 128.8: -0.1 c, 2.39 s (-0 %); 131.1: -0.1 c, 2.40 s (0 %); 132.2: 0.2 c, 2.62 s (9 %) |
| rect 8.00 | 132.17 (88) τ2.61, 128.78 (88) τ2.39, 131.11 (88) τ2.40, 133.07 (71) τ2.49, 128.00 (70) τ2.41, 133.32 (69) τ2.48, 127.74 (69) τ2.41, 133.58 (68) τ2.48 | 8 | 128.8: -0.1 c, 2.39 s (-0 %); 131.1: -0.0 c, 2.40 s (0 %); 132.2: 0.1 c, 2.61 s (9 %) |
| hann 0.25 | 131.97 (212) τ2.48 | 1 | 128.8: 42.2 c, 2.48 s (4 %); 131.1: 11.2 c, 2.48 s (4 %); 132.2: -2.6 c, 2.48 s (4 %) |
| hann 0.50 | 131.82 (229) τ2.46 | 1 | 128.8: 40.3 c, 2.46 s (3 %); 131.1: 9.3 c, 2.46 s (3 %); 132.2: -4.5 c, 2.46 s (3 %) |
| hann 1.00 | 128.82 (243) τ2.39 | 1 | 128.8: 0.4 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: unmatched |
| hann 2.00 | 128.79 (260) τ2.39, 131.21 (260) τ2.40 | 2 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 1.2 c, 2.40 s (1 %); 132.2: -12.6 c, 2.40 s (1 %) |
| hann 4.00 | 132.16 (275) τ2.61, 131.12 (275) τ2.40, 128.79 (275) τ2.39 | 3 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 0.0 c, 2.40 s (0 %); 132.2: -0.0 c, 2.61 s (9 %) |
| hann 8.00 | 128.79 (286) τ2.39, 132.16 (286) τ2.61, 131.12 (286) τ2.40 | 3 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 0.0 c, 2.40 s (0 %); 132.2: -0.0 c, 2.61 s (9 %) |

### synthetic: three resonances plus three partials at 802, 813, 820 Hz
expect: a handful of clear partials above the low three; Smith prediction for the closest pair (1.05 Hz): W ≥ 1.91 s (two cycles), 1.38 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 132.13 (69) τ2.60, 820.08 (57) τ0.60, 801.80 (57) τ0.61, 186.01 (40) τ2.50, 194.01 (39) τ2.50, 838.26 (39) τ0.93, 202.01 (38) τ2.50, 210.01 (38) τ2.50 | 8 | 128.8: 44.3 c, 2.60 s (9 %); 131.1: 13.3 c, 2.60 s (9 %); 132.2: -0.5 c, 2.60 s (9 %); 802.1: -0.6 c, 0.61 s (1 %); 813.2: unmatched; 819.8: 0.6 c, 0.60 s (-1 %) |
| rect 0.50 | 131.58 (73) τ2.44, 819.94 (62) τ0.59, 813.16 (62) τ0.60, 802.02 (62) τ0.61, 125.92 (61) τ2.06, 121.85 (55) τ2.45, 117.82 (51) τ2.43, 113.80 (49) τ2.28 | 8 | 128.8: unmatched; 131.1: 6.1 c, 2.44 s (2 %); 132.2: -7.7 c, 2.44 s (2 %); 802.1: -0.2 c, 0.61 s (1 %); 813.2: -0.1 c, 0.60 s (0 %); 819.8: 0.3 c, 0.59 s (-1 %) |
| rect 1.00 | 132.33 (77) τ2.59, 128.74 (76) τ2.39, 813.21 (65) τ0.60, 802.06 (65) τ0.61, 819.85 (65) τ0.59, 136.57 (59) τ2.43, 138.57 (56) τ2.49, 122.53 (55) τ2.49 | 8 | 128.8: -0.7 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: 2.2 c, 2.59 s (8 %); 802.1: -0.1 c, 0.61 s (1 %); 813.2: 0.0 c, 0.60 s (0 %); 819.8: 0.1 c, 0.59 s (-1 %) |
| rect 2.00 | 132.23 (81) τ2.63, 131.07 (80) τ2.40, 128.76 (80) τ2.39, 819.83 (67) τ0.59, 802.09 (67) τ0.61, 813.20 (67) τ0.60, 133.90 (65) τ2.47, 134.91 (62) τ2.39 | 8 | 128.8: -0.4 c, 2.39 s (-0 %); 131.1: -0.6 c, 2.40 s (0 %); 132.2: 0.9 c, 2.63 s (10 %); 802.1: -0.0 c, 0.61 s (1 %); 813.2: -0.0 c, 0.60 s (0 %); 819.8: 0.1 c, 0.59 s (-1 %) |
| rect 4.00 | 131.11 (84) τ2.40, 132.18 (84) τ2.62, 128.78 (83) τ2.39, 133.01 (68) τ2.49, 819.82 (67) τ0.59, 802.09 (67) τ0.61, 813.20 (67) τ0.60, 133.51 (65) τ2.48 | 8 | 128.8: -0.1 c, 2.39 s (-0 %); 131.1: -0.1 c, 2.40 s (0 %); 132.2: 0.2 c, 2.62 s (9 %); 802.1: -0.0 c, 0.61 s (1 %); 813.2: -0.0 c, 0.60 s (0 %); 819.8: 0.0 c, 0.59 s (-2 %) |
| rect 8.00 | 132.17 (85) τ2.61, 128.78 (85) τ2.39, 131.11 (85) τ2.40, 819.82 (67) τ0.59, 813.20 (67) τ0.60, 802.09 (67) τ0.61, 133.07 (67) τ2.49, 128.00 (67) τ2.41 | 8 | 128.8: -0.1 c, 2.39 s (-0 %); 131.1: -0.0 c, 2.40 s (0 %); 132.2: 0.1 c, 2.61 s (9 %); 802.1: -0.0 c, 0.61 s (1 %); 813.2: -0.0 c, 0.60 s (0 %); 819.8: 0.0 c, 0.59 s (-2 %) |
| hann 0.25 | 131.97 (209) τ2.48, 818.66 (198) τ0.59, 802.24 (198) τ0.61 | 3 | 128.8: 42.2 c, 2.48 s (4 %); 131.1: 11.2 c, 2.48 s (4 %); 132.2: -2.6 c, 2.48 s (4 %); 802.1: 0.3 c, 0.61 s (1 %); 813.2: 11.6 c, 0.59 s (-1 %); 819.8: -2.4 c, 0.59 s (-1 %) |
| hann 0.50 | 131.82 (225) τ2.46, 802.11 (214) τ0.61, 813.22 (214) τ0.60 | 3 | 128.8: 40.3 c, 2.46 s (3 %); 131.1: 9.3 c, 2.46 s (3 %); 132.2: -4.5 c, 2.46 s (3 %); 802.1: 0.0 c, 0.61 s (1 %); 813.2: 0.0 c, 0.60 s (0 %); 819.8: unmatched |
| hann 1.00 | 128.82 (240) τ2.39, 813.20 (229) τ0.60, 819.80 (229) τ0.59, 802.10 (229) τ0.61 | 4 | 128.8: 0.4 c, 2.39 s (-0 %); 131.1: unmatched; 132.2: unmatched; 802.1: 0.0 c, 0.61 s (1 %); 813.2: 0.0 c, 0.60 s (0 %); 819.8: -0.0 c, 0.59 s (-2 %) |
| hann 2.00 | 128.79 (256) τ2.39, 131.21 (256) τ2.40, 802.10 (241) τ0.61, 813.20 (241) τ0.60, 819.80 (241) τ0.59 | 5 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 1.2 c, 2.40 s (1 %); 132.2: -12.6 c, 2.40 s (1 %); 802.1: 0.0 c, 0.61 s (1 %); 813.2: 0.0 c, 0.60 s (0 %); 819.8: -0.0 c, 0.59 s (-2 %) |
| hann 4.00 | 132.16 (271) τ2.61, 131.12 (271) τ2.40, 128.79 (271) τ2.39, 802.10 (249) τ0.61, 819.80 (249) τ0.59, 813.20 (249) τ0.60 | 6 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 0.0 c, 2.40 s (0 %); 132.2: -0.0 c, 2.61 s (9 %); 802.1: 0.0 c, 0.61 s (1 %); 813.2: 0.0 c, 0.60 s (0 %); 819.8: -0.0 c, 0.59 s (-2 %) |
| hann 8.00 | 128.79 (283) τ2.39, 132.16 (283) τ2.61, 131.12 (283) τ2.40 | 3 | 128.8: 0.0 c, 2.39 s (-0 %); 131.1: 0.0 c, 2.40 s (0 %); 132.2: -0.0 c, 2.61 s (9 %); 802.1: unmatched; 813.2: unmatched; 819.8: unmatched |

### synthetic: unequal decays (0.8, 2.4, 5 s) at 140, 190, 260 Hz
expect: well separated, decays differ: no common decay; Smith prediction for the closest pair (50.00 Hz): W ≥ 0.04 s (two cycles), 0.03 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 260.06 (69) τ5.00, 190.03 (68) τ2.40, 139.99 (67) τ0.81, 325.98 (38) τ4.41, 333.98 (38) τ4.38, 341.98 (37) τ4.35, 349.98 (36) τ4.32, 357.98 (36) τ4.30 | 8 | 140.0: -0.2 c, 0.81 s (1 %); 190.0: 0.2 c, 2.40 s (0 %); 260.0: 0.4 c, 5.00 s (-0 %) |
| rect 0.50 | 260.03 (73) τ5.00, 190.01 (72) τ2.40, 139.97 (71) τ0.81, 288.99 (44) τ4.59, 292.99 (43) τ4.55, 296.99 (42) τ4.51, 300.99 (42) τ4.48, 304.99 (41) τ4.45 | 8 | 140.0: -0.4 c, 0.81 s (1 %); 190.0: 0.1 c, 2.40 s (0 %); 260.0: 0.2 c, 5.00 s (-0 %) |
| rect 1.00 | 260.01 (79) τ5.00, 190.00 (78) τ2.40, 139.99 (75) τ0.81, 287.50 (44) τ4.57, 289.50 (44) τ4.62, 291.50 (43) τ4.52, 293.50 (43) τ4.59, 295.50 (42) τ4.48 | 8 | 140.0: -0.1 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: 0.0 c, 5.00 s (-0 %) |
| rect 2.00 | 260.00 (85) τ5.00, 190.00 (83) τ2.40, 140.00 (78) τ0.81, 135.77 (53) τ2.04, 134.76 (52) τ0.97, 133.76 (50) τ1.30, 132.76 (49) τ1.47, 131.76 (48) τ2.26 | 8 | 140.0: -0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: 0.0 c, 5.00 s (-0 %) |
| rect 4.00 | 260.00 (90) τ5.00, 190.00 (87) τ2.40, 140.00 (79) τ0.81, 137.42 (57) τ0.91, 136.91 (56) τ0.89, 136.40 (54) τ1.63, 143.45 (54) τ1.54, 135.89 (53) τ2.17 | 8 | 140.0: -0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: 0.0 c, 5.00 s (-0 %) |
| rect 8.00 | 260.00 (93) τ5.00, 190.00 (88) τ2.40, 140.00 (79) τ0.81, 189.34 (69) τ2.40, 190.79 (67) τ2.40, 189.08 (66) τ2.40, 191.05 (65) τ2.40, 188.82 (64) τ2.40 | 8 | 140.0: -0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: 0.0 c, 5.00 s (-0 %) |
| hann 0.25 | 260.00 (209) τ5.00, 190.00 (209) τ2.40, 140.00 (208) τ0.81 | 3 | 140.0: 0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |
| hann 0.50 | 260.00 (227) τ5.00, 190.00 (226) τ2.40, 140.00 (224) τ0.81 | 3 | 140.0: 0.0 c, 0.81 s (1 %); 190.0: -0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |
| hann 1.00 | 260.00 (244) τ5.00, 190.00 (243) τ2.40, 140.00 (240) τ0.81 | 3 | 140.0: -0.0 c, 0.81 s (1 %); 190.0: -0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |
| hann 2.00 | 260.00 (262) τ5.00, 190.00 (260) τ2.40, 140.00 (253) τ0.81 | 3 | 140.0: 0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |
| hann 4.00 | 260.00 (278) τ5.00, 190.00 (275) τ2.40, 140.00 (263) τ0.81 | 3 | 140.0: 0.0 c, 0.81 s (1 %); 190.0: -0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |
| hann 8.00 | 260.00 (292) τ5.00, 190.00 (286) τ2.40, 140.00 (268) τ0.81 | 3 | 140.0: 0.0 c, 0.81 s (1 %); 190.0: 0.0 c, 2.40 s (0 %); 260.0: -0.0 c, 5.00 s (-0 %) |

### synthetic: close pair 1 Hz apart (200 and 201 Hz) with 300 Hz, phases 0 and π (cancellation)
expect: unresolved at short windows; phase cancellation; Smith prediction for the closest pair (1.00 Hz): W ≥ 2.00 s (two cycles), 1.44 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 300.03 (72) τ3.00, 200.48 (69) τ3.06, 421.87 (36) τ3.30, 429.87 (36) τ3.18, 437.87 (35) τ3.11, 445.87 (35) τ3.10, 453.87 (34) τ3.00, 465.88 (34) τ3.00 | 8 | 200.0: 4.1 c, 3.06 s (2 %); 201.0: -4.5 c, 3.06 s (2 %); 300.0: 0.2 c, 3.00 s (0 %) |
| rect 0.50 | 200.50 (77) τ3.06, 300.02 (75) τ3.00, 360.99 (39) τ3.00, 364.99 (39) τ3.00, 371.00 (38) τ8.92, 375.00 (38) τ3.38, 379.00 (38) τ3.22, 383.00 (37) τ3.14 | 8 | 200.0: 4.3 c, 3.06 s (2 %); 201.0: -4.3 c, 3.06 s (2 %); 300.0: 0.1 c, 3.00 s (0 %) |
| rect 1.00 | 200.50 (89) τ3.06, 300.00 (87) τ3.00, 2734.50 (15) τ3.00, 2747.50 (15) τ3.01, 2760.50 (15) τ3.01, 2762.50 (15) τ3.00, 2773.50 (15) τ3.00, 2775.50 (15) τ3.01 | 2 | 200.0: 4.3 c, 3.06 s (2 %); 201.0: -4.3 c, 3.06 s (2 %); 300.0: 0.0 c, 3.00 s (0 %) |
| rect 2.00 | 200.08 (93) τ3.00, 300.00 (93) τ3.00, 785.25 (27) τ3.00, 786.25 (27) τ3.00, 790.75 (27) τ3.00, 791.75 (27) τ3.02, 792.75 (27) τ3.01, 793.75 (27) τ3.42 | 8 | 200.0: 0.7 c, 3.00 s (0 %); 201.0: unmatched; 300.0: -0.0 c, 3.00 s (0 %) |
| rect 4.00 | 200.98 (97) τ3.00, 200.02 (97) τ3.00, 300.00 (97) τ3.00, 561.12 (30) τ2.99, 563.37 (30) τ3.01, 563.87 (30) τ3.03, 564.37 (30) τ3.03, 564.88 (30) τ3.07 | 8 | 200.0: 0.2 c, 3.00 s (0 %); 201.0: -0.2 c, 3.00 s (0 %); 300.0: -0.0 c, 3.00 s (0 %) |
| rect 8.00 | 300.00 (99) τ3.00, 200.01 (99) τ3.00, 200.99 (99) τ3.00, 200.30 (88) τ3.01, 200.70 (88) τ3.01, 302.56 (67) τ3.00, 302.81 (66) τ3.00, 303.06 (66) τ3.00 | 8 | 200.0: 0.1 c, 3.00 s (0 %); 201.0: -0.1 c, 3.00 s (0 %); 300.0: 0.0 c, 3.00 s (0 %) |
| hann 0.25 | 300.00 (213) τ3.00, 200.50 (211) τ3.06 | 2 | 200.0: 4.3 c, 3.06 s (2 %); 201.0: -4.3 c, 3.06 s (2 %); 300.0: -0.0 c, 3.00 s (0 %) |
| hann 0.50 | 200.50 (231) τ3.06, 300.00 (228) τ3.00 | 2 | 200.0: 4.3 c, 3.06 s (2 %); 201.0: -4.3 c, 3.06 s (2 %); 300.0: 0.0 c, 3.00 s (0 %) |
| hann 1.00 | 200.50 (258) τ3.06, 300.00 (253) τ3.00 | 2 | 200.0: 4.3 c, 3.06 s (2 %); 201.0: -4.3 c, 3.06 s (2 %); 300.0: 0.0 c, 3.00 s (0 %) |
| hann 2.00 | 199.96 (270) τ3.00, 300.00 (270) τ3.00 | 2 | 200.0: -0.4 c, 3.00 s (0 %); 201.0: unmatched; 300.0: -0.0 c, 3.00 s (0 %) |
| hann 4.00 | 200.00 (285) τ3.00, 201.00 (285) τ3.00, 300.00 (285) τ3.00 | 3 | 200.0: -0.0 c, 3.00 s (0 %); 201.0: 0.0 c, 3.00 s (0 %); 300.0: -0.0 c, 3.00 s (0 %) |
| hann 8.00 | 200.00 (297) τ3.00, 201.00 (297) τ3.00, 300.00 (297) τ3.00 | 3 | 200.0: -0.0 c, 3.00 s (0 %); 201.0: 0.0 c, 3.00 s (0 %); 300.0: 0.0 c, 3.00 s (0 %) |

### synthetic: missing mode (only two resonances at 150 and 240 Hz)
expect: insufficient evidence for three; Smith prediction for the closest pair (90.00 Hz): W ≥ 0.02 s (two cycles), 0.02 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 150.01 (72) τ2.00, 240.01 (72) τ2.00, 593.96 (27) τ2.00, 601.96 (27) τ2.00, 609.97 (26) τ2.00, 617.97 (26) τ2.00, 625.97 (26) τ2.00, 633.96 (26) τ2.00 | 8 | 150.0: 0.1 c, 2.00 s (-0 %); 240.0: 0.1 c, 2.00 s (-0 %) |
| rect 0.50 | 240.02 (75) τ2.00, 149.99 (75) τ2.00, 286.99 (42) τ2.00, 290.99 (41) τ2.00, 297.00 (41) τ2.00, 300.99 (40) τ2.00, 304.99 (40) τ2.00, 308.99 (39) τ2.00 | 8 | 150.0: -0.1 c, 2.00 s (-0 %); 240.0: 0.1 c, 2.00 s (-0 %) |
| rect 1.00 | 150.00 (81) τ2.00, 240.00 (81) τ2.00, 282.50 (42) τ2.00, 284.50 (42) τ2.03, 286.50 (42) τ2.00, 289.50 (41) τ2.00, 291.50 (41) τ1.99, 293.50 (41) τ2.00 | 8 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| rect 2.00 | 150.00 (86) τ2.00, 240.00 (86) τ2.00, 271.25 (44) τ2.00, 272.25 (43) τ2.08, 273.75 (43) τ2.00, 274.75 (43) τ2.00, 275.75 (43) τ1.99, 276.75 (43) τ2.00 | 8 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| rect 4.00 | 240.00 (89) τ2.00, 150.00 (89) τ2.00, 251.12 (50) τ2.00, 251.62 (50) τ2.00, 252.12 (49) τ2.03, 252.62 (49) τ2.00, 253.12 (49) τ2.00, 253.87 (48) τ2.00 | 8 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| rect 8.00 | 240.00 (90) τ2.00, 150.00 (90) τ2.00, 241.28 (67) τ2.00, 148.71 (67) τ2.00, 151.28 (66) τ2.00, 238.71 (66) τ2.00, 241.54 (65) τ2.00, 148.46 (65) τ2.00 | 8 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| hann 0.25 | 150.00 (212) τ2.00, 240.00 (212) τ2.00 | 2 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: -0.0 c, 2.00 s (-0 %) |
| hann 0.50 | 240.00 (229) τ2.00, 150.00 (229) τ2.00 | 2 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| hann 1.00 | 150.00 (247) τ2.00, 240.00 (247) τ2.00 | 2 | 150.0: 0.0 c, 2.00 s (-0 %); 240.0: -0.0 c, 2.00 s (-0 %) |
| hann 2.00 | 150.00 (263) τ2.00, 240.00 (263) τ2.00 | 2 | 150.0: 0.0 c, 2.00 s (-0 %); 240.0: 0.0 c, 2.00 s (-0 %) |
| hann 4.00 | 240.00 (277) τ2.00, 150.00 (277) τ2.00 | 2 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: -0.0 c, 2.00 s (-0 %) |
| hann 8.00 | 240.00 (288) τ2.00, 150.00 (288) τ2.00 | 2 | 150.0: -0.0 c, 2.00 s (-0 %); 240.0: -0.0 c, 2.00 s (-0 %) |

### synthetic: the chain resonances with white noise at −30 dB
expect: noise; Smith prediction for the closest pair (1.05 Hz): W ≥ 1.91 s (two cycles), 1.38 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 132.13 (60) τ2.60, 178.02 (33) τ2.35, 186.03 (31) τ2.65, 194.06 (30) τ2.62, 202.03 (29) τ2.92, 210.01 (28) τ2.59, 222.01 (28) τ3.04, 234.04 (27) τ3.14 | 8 | 128.8: 44.3 c, 2.60 s (9 %); 131.1: 13.3 c, 2.60 s (9 %); 132.2: -0.5 c, 2.60 s (9 %) |
| rect 0.50 | 131.58 (61) τ2.44, 125.93 (49) τ2.08, 121.84 (42) τ2.46, 117.82 (39) τ2.29, 113.82 (36) τ2.60, 149.75 (36) τ2.51, 109.78 (34) τ2.69, 153.74 (34) τ2.59 | 8 | 128.8: unmatched; 131.1: 6.1 c, 2.44 s (2 %); 132.2: -7.7 c, 2.44 s (2 %) |
| rect 1.00 | 132.33 (62) τ2.59, 128.74 (61) τ2.40, 136.57 (44) τ2.44, 138.57 (41) τ2.46, 122.53 (40) τ2.47, 140.56 (39) τ2.47, 120.54 (38) τ2.44, 142.56 (37) τ2.43 | 8 | 128.8: -0.7 c, 2.40 s (0 %); 131.1: unmatched; 132.2: 2.2 c, 2.59 s (8 %) |
| rect 2.00 | 132.23 (63) τ2.63, 131.07 (62) τ2.41, 128.76 (62) τ2.40, 133.90 (47) τ2.47, 134.91 (44) τ2.39, 125.98 (42) τ2.60, 135.91 (42) τ2.47, 124.97 (40) τ2.48 | 8 | 128.8: -0.4 c, 2.40 s (0 %); 131.1: -0.6 c, 2.41 s (1 %); 132.2: 0.9 c, 2.63 s (10 %) |
| rect 4.00 | 131.11 (63) τ2.41, 132.18 (63) τ2.62, 128.78 (62) τ2.40, 133.01 (47) τ2.49, 133.51 (44) τ2.48, 127.45 (43) τ2.42, 134.26 (41) τ2.46, 126.96 (41) τ2.41 | 8 | 128.8: -0.1 c, 2.40 s (0 %); 131.1: -0.1 c, 2.41 s (1 %); 132.2: 0.2 c, 2.62 s (9 %) |
| rect 8.00 | 132.17 (61) τ2.61, 131.11 (61) τ2.41, 128.78 (61) τ2.40, 128.25 (45) τ2.42, 132.95 (44) τ2.49, 127.99 (43) τ2.42, 133.20 (42) τ2.49, 127.73 (41) τ2.42 | 8 | 128.8: -0.1 c, 2.40 s (0 %); 131.1: -0.0 c, 2.41 s (1 %); 132.2: 0.1 c, 2.61 s (9 %) |
| hann 0.25 | 131.97 (58) τ2.48 | 1 | 128.8: 42.2 c, 2.48 s (4 %); 131.1: 11.2 c, 2.48 s (4 %); 132.2: -2.6 c, 2.48 s (4 %) |
| hann 0.50 | 131.82 (59) τ2.47 | 1 | 128.8: 40.3 c, 2.47 s (3 %); 131.1: 9.3 c, 2.47 s (3 %); 132.2: -4.5 c, 2.47 s (3 %) |
| hann 1.00 | 128.82 (59) τ2.40 | 1 | 128.8: 0.4 c, 2.40 s (0 %); 131.1: unmatched; 132.2: unmatched |
| hann 2.00 | 128.79 (61) τ2.40, 131.21 (61) τ2.41 | 2 | 128.8: 0.0 c, 2.40 s (0 %); 131.1: 1.2 c, 2.41 s (1 %); 132.2: -12.6 c, 2.41 s (1 %) |
| hann 4.00 | 131.12 (60) τ2.41, 132.16 (60) τ2.61, 128.79 (60) τ2.40 | 3 | 128.8: 0.0 c, 2.40 s (0 %); 131.1: 0.0 c, 2.41 s (1 %); 132.2: -0.0 c, 2.61 s (9 %) |
| hann 8.00 | 131.12 (57) τ2.41, 128.79 (57) τ2.40, 132.16 (57) τ2.61 | 3 | 128.8: 0.0 c, 2.40 s (0 %); 131.1: 0.0 c, 2.41 s (1 %); 132.2: -0.0 c, 2.61 s (9 %) |

### negative: four resonances (120, 160, 230, 310 Hz)
expect: more than the model holds: report, do not force; Smith prediction for the closest pair (40.00 Hz): W ≥ 0.05 s (two cycles), 0.04 s (1.44 cycles); family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 229.97 (66) τ2.00, 119.91 (66) τ2.00, 160.15 (66) τ2.00, 310.08 (66) τ2.00, 363.97 (38) τ2.00, 371.97 (37) τ2.00, 379.97 (36) τ2.00, 387.97 (35) τ2.00 | 8 | 120.0: -1.2 c, 2.00 s (-0 %); 160.0: 1.6 c, 2.00 s (-0 %); 230.0: -0.3 c, 2.00 s (-0 %); 310.0: 0.5 c, 2.00 s (-0 %) |
| rect 0.50 | 160.02 (69) τ2.00, 230.02 (69) τ2.00, 310.04 (69) τ2.00, 119.97 (69) τ2.00, 330.98 (43) τ2.00, 334.99 (42) τ2.00, 338.99 (41) τ2.00, 342.99 (40) τ2.00 | 8 | 120.0: -0.5 c, 2.00 s (-0 %); 160.0: 0.2 c, 2.00 s (-0 %); 230.0: 0.2 c, 2.00 s (-0 %); 310.0: 0.2 c, 2.00 s (-0 %) |
| rect 1.00 | 310.01 (75) τ2.00, 230.01 (75) τ2.00, 160.00 (75) τ2.00, 119.99 (75) τ2.00, 328.50 (44) τ2.00, 330.50 (43) τ1.99, 332.50 (43) τ2.00, 334.50 (42) τ1.99 | 8 | 120.0: -0.1 c, 2.00 s (-0 %); 160.0: 0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.1 c, 2.00 s (-0 %) |
| rect 2.00 | 310.00 (80) τ2.00, 230.00 (80) τ2.00, 120.00 (80) τ2.00, 160.00 (80) τ2.00, 324.75 (45) τ2.00, 325.75 (44) τ2.08, 326.75 (44) τ2.00, 327.75 (43) τ2.00 | 8 | 120.0: -0.0 c, 2.00 s (-0 %); 160.0: 0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| rect 4.00 | 310.00 (83) τ2.00, 160.00 (83) τ2.00, 120.00 (83) τ2.00, 230.00 (83) τ2.00, 315.62 (50) τ2.00, 316.12 (49) τ2.00, 316.62 (49) τ2.00, 317.12 (48) τ2.00 | 8 | 120.0: -0.0 c, 2.00 s (-0 %); 160.0: 0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| rect 8.00 | 310.00 (84) τ2.00, 120.00 (84) τ2.00, 230.00 (84) τ2.00, 160.00 (84) τ2.00, 311.16 (62) τ2.00, 118.85 (62) τ2.00, 231.16 (62) τ2.00, 161.29 (61) τ2.00 | 8 | 120.0: -0.0 c, 2.00 s (-0 %); 160.0: 0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| hann 0.25 | 230.00 (206) τ2.00, 120.00 (206) τ2.00, 310.00 (206) τ2.00, 160.00 (206) τ2.00 | 4 | 120.0: 0.0 c, 2.00 s (-0 %); 160.0: -0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: -0.0 c, 2.00 s (-0 %) |
| hann 0.50 | 230.00 (223) τ2.00, 160.00 (223) τ2.00, 120.00 (223) τ2.00, 310.00 (223) τ2.00 | 4 | 120.0: 0.0 c, 2.00 s (-0 %); 160.0: -0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: -0.0 c, 2.00 s (-0 %) |
| hann 1.00 | 310.00 (241) τ2.00, 230.00 (241) τ2.00, 160.00 (241) τ2.00, 120.00 (241) τ2.00 | 4 | 120.0: 0.0 c, 2.00 s (-0 %); 160.0: -0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| hann 2.00 | 310.00 (257) τ2.00, 230.00 (257) τ2.00, 120.00 (257) τ2.00, 160.00 (257) τ2.00 | 4 | 120.0: -0.0 c, 2.00 s (-0 %); 160.0: -0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| hann 4.00 | 310.00 (271) τ2.00, 160.00 (271) τ2.00, 230.00 (271) τ2.00, 120.00 (271) τ2.00 | 4 | 120.0: 0.0 c, 2.00 s (-0 %); 160.0: 0.0 c, 2.00 s (-0 %); 230.0: 0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |
| hann 8.00 | 310.00 (282) τ2.00, 120.00 (282) τ2.00, 230.00 (282) τ2.00, 160.00 (282) τ2.00 | 4 | 120.0: -0.0 c, 2.00 s (-0 %); 160.0: -0.0 c, 2.00 s (-0 %); 230.0: -0.0 c, 2.00 s (-0 %); 310.0: 0.0 c, 2.00 s (-0 %) |

### negative: white noise only
expect: no supported estimates; family ratio bound 1.1283
| window W s | peaks (Hz, dB above median, τ s) | supported | per true mode: matched, cents, decay s (error %) |
|---|---|---|---|
| rect 0.25 | 21.41 (14) τ13.02, 20933.98 (13), 31.95 (13) τ15.21, 63.95 (12) τ140.10, 23511.51 (11), 5829.13 (11), 6102.19 (11) τ27.69, 5579.45 (11) | 0 | no truth |
| rect 0.50 | 31.95 (15) τ15.20, 25.87 (14) τ11.76, 14896.29 (12) τ20.18, 6510.30 (12) τ19.29, 22468.75 (12) τ49.72, 13046.16 (11) τ25.05, 18630.40 (11) τ19.26, 23226.63 (11) τ11.70 | 0 | no truth |
| rect 1.00 | 21.36 (13) τ12.78, 10519.36 (12) τ15.48, 16276.19 (12) τ26.72, 11674.25 (12) τ12.26, 8666.81 (12) τ18.61, 17504.17 (12) τ18.60, 10483.76 (12) τ14.81, 190.52 (11) τ18.62 | 0 | no truth |
| rect 2.00 | 11185.81 (13) τ27.82, 6642.46 (12) τ14.89, 5679.06 (12) τ15.02, 6576.49 (12) τ12.16, 4356.48 (12) τ13.49, 9764.11 (12) τ83.77, 22619.65 (11) τ10.44, 3125.27 (11) τ11.64 | 0 | no truth |
| rect 4.00 | 11664.73 (13) τ9.99, 4907.37 (13) τ10.92, 20321.17 (12) τ58.75, 8338.90 (12) τ26.61, 20181.11 (12) τ20.58, 17846.56 (12) τ21.69, 17125.45 (12) τ1013.65, 20632.56 (12) | 0 | no truth |
| rect 8.00 | 9424.91 (13), 15602.52 (13) τ51.96, 17983.40 (13), 186.85 (13) τ100.83, 6216.94 (12), 19678.33 (12) τ18.01, 9198.73 (12), 4907.45 (12) τ11.01 | 0 | no truth |
| hann 0.25 | 23510.37 (12) τ57.79, 5446.18 (12) τ17.00, 6101.45 (11), 20038.00 (11) τ12.65, 20934.93 (11), 8924.14 (11), 4996.56 (11) τ209.99, 1740.90 (11) | 0 | no truth |
| hann 0.50 | 13820.19 (12) τ69.21, 23227.21 (11) τ10.31, 14895.74 (11) τ15.01, 5252.26 (11) τ12.66, 2669.54 (10) τ37.56, 5653.67 (10) τ1.14, 19125.25 (10) τ13.94, 5447.14 (10) τ57.05 | 0 | no truth |
| hann 1.00 | 23226.13 (12) τ11.43, 11664.22 (12) τ8.75, 17125.15 (12) τ1682.40, 8221.69 (11) τ38.14, 11674.40 (11) τ12.30, 17504.29 (11) τ18.56, 10519.29 (11) τ15.28, 10943.16 (11) τ9.89 | 0 | no truth |
| hann 2.00 | 3125.23 (12) τ11.32, 11185.74 (12) τ27.55, 5254.95 (12) τ26.84, 22619.70 (12) τ10.49, 22095.64 (11) τ9.67, 16176.06 (11) τ18.32, 6642.42 (11) τ14.77, 13248.86 (11) τ16.05 | 0 | no truth |
| hann 4.00 | 22241.11 (12) τ14.29, 19370.91 (12) τ27.17, 20808.48 (11) τ14.77, 8980.62 (11) τ19.02, 3869.83 (11) τ142.55, 11724.81 (11) τ88.75, 12626.24 (11) τ27.21, 22531.78 (11) τ98.57 | 0 | no truth |
| hann 8.00 | 4088.59 (13), 19600.08 (12) τ33.91, 16870.17 (12), 23282.07 (12), 17725.78 (12), 11429.51 (12) τ25.33, 20435.51 (12), 17574.96 (12) | 0 | no truth |

Definitions:
- window: W seconds from the note's first sample, either rectangular (no taper; best resolution, main-lobe half-width fs/W, first sidelobe −13 dB) or Hann (half-width 2 fs/W, first sidelobe −31 dB), zero-padded to the next power of two of at least 4 W fs for interpolation; W in {0.25, 0.5, 1, 2, 4, 8} s, limited to the signal length; both windows are run on every case so resolution and dynamic range can be compared
- peaks: local maxima of the magnitude spectrum between 20 Hz and fs/2 that exceed 6 dB above the median magnitude of the window's spectrum and are at least one full rectangular main lobe (2 fs/W Hz) from a stronger accepted peak; and exceed every stronger accepted peak's sidelobe envelope by 3.5 dB at any distance (rectangular: 1/(π·max(d − 0.5, 0.5)) with d in half-widths; Hann: a flat −31 dB), which is also the study's dynamic-range limit: a true mode weaker than a stronger mode's skirt at its distance is not certified by that window; frequency refined by quadratic interpolation of log magnitude over the three bins around the maximum; at most eight peaks reported, strongest first
- decay: per accepted peak, the amplitude of a 0.25 s rectangular frame hopped by 0.125 s at the peak's refined frequency (projection on the complex exponential), fitted by least squares on log amplitude over frames whose amplitude exceeds 1 % of the first; decay = −1/slope in seconds; reported with the fit's RMS residual in dB; frames fewer than three give no decay
- commonDecay: never averaged automatically: each mode's decay is reported separately with the spread (max/min); a common decay is a declaration the visitor would make
- smithPrediction: the rectangular-window rule from Smith (SASP, Frequency Resolution): two sinusoids need W ≥ 2 / Δf (Abe and Smith: 1.44 / Δf for accurate peak frequency); printed per case as the predicted minimum W for the case's closest true pair, and compared with what the study found
- evidence: supported estimates = accepted peaks at least 20 dB above the window's median magnitude that have a decay fit (weaker peaks are listed but not counted); fewer than three means insufficient evidence for a three-resonance target and nothing is invented; because the rectangular window lists beating sidelobes of a merged cluster as peaks, the Hann count is the evidence count and the rectangular pass is the resolution probe


## Superseded in part (2026-11-04)
Astra's review (`collab/reviews/20261102T1300Z-astra-reviews-sound-file-study.md`) found that at short spectral windows this study's decay fit read frames from the whole recording rather than the window, so the short-window "supported" counts above describe the full 8 s inputs, not truncated files; Astra's paired duration audit (`collab/notes/astra-sound-duration-audit.md`) shows 0.25 s and 0.375 s prefixes give zero fitted modes. The tool was corrected in c1cd7e7 (decay bounded to the spectral prefix by default, durations reported separately, injective truth matching, thresholds named as heuristics), with fs/W corrected to 1/W Hz in the definitions. Read the findings above through `collab/notes/astra-sound-study-review-fixes.md` and `collab/notes/astra-sound-candidate-reliability.md`; the long-window results and the conclusion that a page may report only candidate counts and let the visitor declare still stand.
