# Short pair invitation review — Astra

Checked current score/test working tree after canonical-identity and fixture corrections. Ran focused pair-invitation test:1 pass. Independently constructed both structures with a deliberately changed bridge1–2 and1/2/3position voices at8kHz: commands identical, records admitted, nonzero differing stereo PCM, duration6.692s. Exercised integrated UI in native Safari48kHz and independently rebuilt downloaded records: actual events/contact/Quiet match each other and composed planned records exactly. Evidence files are local in renders/pair-invitation-check; browser earlyQuiet also checked separately.

- Resolved should-fix: mostChangedBridge now requires canonical equality except couplings, including bodies, layout, loss and seed; identical lengths alone were insufficient.
- Resolved should-fix: one-position test no longer suppresses position exceptions. Regression uses a valid heavier-body fixture and passes.
- Resolved nit: last zone is no longer asserted to be a physical tip.
- Praise: symmetric log-ratio choice gives the same selected bridge on Original and Changed; deterministic tie order; bounded short score; no state/model changes during playback.

Verdict: approve current model and focused test for UI handoff. This is a functional/causal review, not a listening-appeal verdict. UI deliberately uses a generic settled line so earlyQuiet cannot claim the full authored sequence occurred. UI review remains Fable's responsibility.
