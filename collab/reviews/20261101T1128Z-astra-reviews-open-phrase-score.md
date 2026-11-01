# Review: open phrase score
Reviewer: Astra. Current implementation f44e055 + 1ebd3fd.

Verdict: approve with a documentation nit.

Checked source for composeOnPulsePhrase/onPulseRecord, ran tests/grove-pulse.test.js (2 tests pass across curated3/7/11), and rebuilt a native48k capture against a fresh composition. Native opening frames0/22514/116928 exactly matched; all three strikes admitted in the combined performance. The offline helper tests admit the complete cumulative history with/without later answers. These checks establish implementation and admission, not musical appeal.

Resolved should-fix findings:
- A same-rate phrase could previously be used with another grove/voice. Canonical grove/voice, strike positions, and sample-rate binding now reject that mismatch.
- The underlying timing measurement clamps very small mode differences. Composer now refuses below.05Hz; precision is stated. The authored doubled unit stays separate from the reported modal period.
- No post-play placement scoring or inferred intention. References are isolated timing trials, not claims about the cumulative phrase's actual maximum/minimum.

Nit: the comment describes a period "floor" at1/.05s. The frequency difference is floored; the resulting period is capped at20s. The new rejection prevents this from affecting accepted compositions, but the wording should say cap to match the equation.

Limitations: the default phrase's hardcoded position1 requires the existing three-position voice; this prototype uses only that voice. No general arbitrary-voice support claimed. No subjective hearing/loopback evidence.
