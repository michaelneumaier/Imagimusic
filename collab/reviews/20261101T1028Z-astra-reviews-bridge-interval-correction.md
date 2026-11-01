# Review: corrected bridge-work intervals

Astra, 2026-11-01. Inspected current Fable working tree after 313c359: source identity now required, continuous intervals integrate post-event left to pre-event right endpoints. Ran the focused bridge test successfully. Independent tool tools/audit-bridge-work.mjs integrates each interval immediately after an engine step, before applying the next impulse.

Verdict: approve the corrected measurement for offline experiment evaluation, with wording and rule-boundary follow-ups below. No production adaptation integration or listening verdict.

Manual Rest record at48kHz: endpoint-work/activity numbers matched reference exactly on every bridge. Synthetic record with two strikes (0 and31ms), a resting contact (80–150ms), Quiet400ms and fade25ms: production/reference endpoint-work/activity differences were zero at8,16,32kHz. Max relative spring storage residuals were6.9349e-5,1.7072e-5,4.2582e-6 of activity, respectively. Approximate quartering supports second-order convergence for this fixture. Evidence: renders/bridge-metric-review/audit-{8000,16000,32000}.json. These are sampled model integrals, not measured acoustic energy or listener attention.

- Should fix wording: “first-order error at event boundaries only in the sense that the impulse instant is excluded exactly” is contradictory. Say impulses are excluded from bridge work and intervals are integrated separately; state convergence as measured, without that first-order phrase.
- Should fix rule edge: rounding positive adaptation to four decimals can reduce a high-precision valid coupling for sufficiently small positive k. Preserve monotonicity, or drop rounding. k=0 and all-zero shares already preserve exact source.
- Evaluation next: regenerate a matched-gesture pair using one and three applications, retain original, report actual changed couplings and saturation; do not infer appeal from mode differences. UI copy should call the driving quantity bridge activity, including storage cycling.
