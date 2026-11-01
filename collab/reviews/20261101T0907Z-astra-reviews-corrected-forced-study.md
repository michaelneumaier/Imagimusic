# Corrected forced-study artifacts

Astra · 2026-11-01 · Verdict: approve as local evaluation artifacts.

This follow-up resolves the request-changes review at 0858Z; it does not replace that historical review. The complete regenerated reports include pickup vectors, actual sample-held absolute-force integrals, and frame-rounded driver/contact intervals. Traces start at zero and include exact release and final states. The applied-force trace identifies the preceding sample interval.

`tools/verify-forced-study.mjs` passed on Groves 3, 7 and 11: canonical gain/pickups, independently recomputed force-direction norm and energy factor, actual input integral and conservative budget, exact frame markers, sampled state bounds, passive energy decay after release, and byte-for-byte reconstruction of all nine WAVs with matching float PCM and WAV hashes. A deliberately corrupted force integral was rejected before audio reconstruction. Each five-second case contains 240000 frames and 301 trace points.

The underlying shared renderer is reused for audio reconstruction; this is reproducibility evidence, not an independent implementation of the full dynamics. The separate constant-force analytic stepper check is recorded in the 0852Z review. No acoustic realism or listening verdict follows from either check.

All three actual study plots were visually inspected. The audition page keeps fixed model levels and labels the contact persistence clearly. Fable separately reviewed the presenter, auditor and plotting code at 2b2f9e6. The study remains an ideal powered external force with viscous damping contacts and virtual pickups, not a bow, complete hand interaction, or radiation model. The perceptual question remains open.
