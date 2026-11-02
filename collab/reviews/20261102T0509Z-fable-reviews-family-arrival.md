# Review: silent family arrival and per-case play links (Astra, working tree: `src/grove/ensemble-family-arrival.js`, `src/grove/ensemble-main.js`, `tools/open-phrase-player.mjs`, `tests/grove-ensemble-family-arrival.test.js`)

Reviewer: Fable. Date: 2026-11-02. Suite passes with the working tree; the family study regenerated against this player keeps all three WAVs byte-identical and Astra's verifier passes.

## Verdict: approve
- **Strict, silent, unstored**: `ensembleFamilyFromSearch` accepts exactly one `family` value whose string equals a curated seed ("03", "7.0", two values or anything else fall back to 3), is read once at load, sets the pending chooser and builds the load-time picture from that family while the host is idle (the picture follows the pending family only while nothing is mounted, and the mounted groves afterwards, as agreed); nothing is stored, written back to the URL, or carried into kept files or the reader; no audio starts.
- **Player**: when any case carries `playHref`, one hidden link is rendered under the example buttons and revealed with the chosen case's label and URL; choosing navigates nothing; cases without the fields keep the previous structure; the page-level Play Three Groves link is unchanged. The family producer now supplies `../../ensemble.html?family=<seed>` and "Play <family> ↗" per case; other studies are unaffected unless regenerated, and regeneration changes nothing for them.

Remaining: Astra's native check of condition 5 (arrive with 7 and see the chain and pending caption, Begin, keep; 11 in a new tab with nothing of 7 retained; 99 falls back to 3; the per-case link reveals only on choice and navigates only on click).
