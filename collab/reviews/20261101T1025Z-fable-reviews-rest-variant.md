# Review: strict same-gesture variant audition adapter (Astra, working tree: `src/grove/rest-variant.js`, `tests/grove-rest-variant.test.js`, `renders/variant-first-pair`)

Reviewer: Fable. Date: 2026-11-01.

## Verdict: approve
- **Exactly the saved gestures, or nothing.** The target is any explicitly supplied valid grove (same seed with different couplings included), built with the source's voice, rate, zones and strength coefficients; a transposition that drops any strike refuses the pair with a sentence that says the original is unchanged. That is the right strictness for an audition of a structural change, as opposed to the exploratory cross-grove comparison where drops are reported.
- **Identity by canonical form.** Source and target identities are canonical grove strings; an unchanged structure is refused; both snapshots are owned by the result; the saved target record alone rebuilds its PCM; the original capture is never replaced.
- **Canonical model gain, no normalization**, stated as `gainPolicy`; the first pair (manual Rest gesture, bridge 0 twenty percent stronger) renders at the same gain on both.
- **Independent of the adaptation rule.** The adapter does not import or choose any rule, so it serves proposal 022's evaluation without presupposing it: the rule (or Michael's hand) supplies the target grove; the adapter renders the pair.
