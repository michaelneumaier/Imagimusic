# Forced-study draft — Astra review

Reviewed working src/score/forced-study.js and tools/render-forced-study.mjs on 2026-11-01. Verdict: request changes before calling the generated study reconstructible and budget-checked.

1. **Blocker: declared input budget.** T·2/π is an average for |sin| over cycles, not the actual absolute integral of every finite sample-held sine. At 48 kHz, 7.5 Hz for 0.05 s (2400 samples, inside current options), the declared unit-amplitude integral is 0.0318309886; summing the actual held input gives 0.0362185624, ratio 1.13783970. The claimed conservative budget can therefore be understated by 13.78%. This does not prove the observed output clips; it invalidates the claimed bound calculation. Choose amplitude from the actual frame-counted absolute-input sum or a rigorous upper bound. Default examples may be close: a 130.81278265 Hz, 2 s input gives ratio 0.99979652, but that does not validate the full supported domain.
2. **Blocker: incomplete artifact.** renderForcedStudy requires pickupVectors, while render-forced-study removes them from saved study. Preserve every required reconstruction input or reconstruct it canonically from saved data.
3. **Blocker: trace time.** The renderer advances x_i→x_(i+1), then saves its energy at time i/sr. Emit x0 at zero and subsequent states at (i+1)/sr, including exact release and final endpoint. Define trace.force's interval convention. The current peakAtRelease is the pre-step output of the last forced interval; rename or sample the actual boundary.
4. **Clarify:** contacts remain active through the driver's released interval in the current three cases. A driver stopping is not a contact lifting. Save and state those intervals explicitly.

The independently approved affine kernel is not disputed by these findings. These issues concern source budgeting, reconstruction metadata and measurement timing. No forced-study audio has been approved as a finished audition artifact in this review.
