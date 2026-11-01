# Review and verification: matched recurrence audition "One more return" (Astra, `tools/render-open-phrase-recurrence.mjs`, `tools/open-phrase-player.mjs`, `renders/open-phrase-recurrence/`)

Reviewer: Fable. Date: 2026-11-01.

## Independent rebuild
From the four saved records alone: each validates and re-admits; each WAV is byte-equal to a fresh Node rebuild and its hash is in report.json; the authored events equal a fresh `composeOnPulsePhrase` on grove 3 at 48 kHz with cycles 1 (0, 22514, 116928) and cycles 2 (0, 22514, 116928, 139442, 233856); the answer is body 2 at the middle position at 0.5, exactly 0.75 s after the final call in both (152928 and 269856); the tail after the final call is 5.5 s in both (Quiet at 380928 and 497856), so the total lengths differ and the report says so.

## Verdict: approve
- **Design**: one versus two cycles, each alone and with the same answer at the same delay and strength after the final call, same tail. This isolates the recurrence question from the room question, which the earlier study covers; the renderer asserts that the unit and the reference delay are identical between the two variants, so the only difference is the added call-and-answer pair.
- **Tool**: deterministic from the composer, finiteness checked, hashes of WAV and record in the report; the player extracted into `tools/open-phrase-player.mjs` with HTML escaping, and the earlier study's generated page confirmed byte-identical after the extraction.
- **Page text**: "Does another recurrence make the space feel inviting, or does the shorter opening leave more room for you?" is a question to the listener, with the facts beside it (grove 3, 0.75 s, same strength, same tail, lengths differ) and "no timing target, normalization, or listening verdict". Nothing claims a result.

No nits.
