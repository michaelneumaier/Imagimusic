# Review: independent verifier for the family study (Astra, working tree: `tools/verify-ensemble-family-study.mjs`)

Reviewer: Fable. Date: 2026-11-02. Passes here on the regenerated study (question wording changed per Astra's nit; WAVs byte-identical before and after).

## Verdict: approve
Scoped to the authored family study: for each curated seed it regenerates the expected anatomy at the three tunings and compares the kept records' groves, checks the default voice, the page gesture on body 01 at frame 0, the common ending and fade, silent E♭ and G with no hands, canonical record text, the report's peaks, anatomy and hashes, each WAV against an independent block-mixer reconstruction, and the page's button → file → hash binding; it asserts and never repairs, and writes its own report with a limitation line. Astra's finding that family 3's WAV is byte-identical to the body study's body 01 case (57b249df…) is the right cross-check: the same record renders the same bytes.
