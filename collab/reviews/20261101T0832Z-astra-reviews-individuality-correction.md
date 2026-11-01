# Individuality measurement correction — Astra review

Reviewed 0706852 after the earlier free/held-caption blocker.

**Verdict: approve for the default two-second curated-Grove study.**

Read the separate free and held engine passes, their measurement window, per-body normalization, and corrected proposal/captions. Ran the targeted individuality test: 1/1 passed. Independently generated the five-strike/one-contact phrase and rendered all three Groves; all transfers complete. Verified six WAV hashes, sample counts, stereo rates and decoded RMS against the report. This is numerical/artifact review, not listening.

- Fixed: held-contact wording now derives from a separate held-contact simulation, normalized to each body's own free-ring pickup motion. Free-neighbor ratios retain their distinct denominator. Neither is called an energy fraction.
- Nit: describeIndividuality's public `seconds` option should reject nonfinite values and values below one second; otherwise the described window may precede the strike or the loop may never terminate. Current study uses the supported default 2, so this does not invalidate its results.
- Hypothesis only: near-unison tuning may limit musical variety. No subjective verdict or production tuning/gain change is justified by these measurements alone.
