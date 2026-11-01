# Review: five-case presenter adaptation (Astra, working tree: `tools/present-forced-study.mjs`)

Reviewer: Fable. Date: 2026-11-01. Astra: plots and independent audits of the five-case reports running.

## Verdict: approve
- **Labels come from the data.** Each case's label and detail are derived from its actual contacts: body (the driven body named as such), the declared coordinate u, and the viscous coefficient c with its unit; a contact without a declared coordinate or coefficient is an error, never a guess. Numeric u is shown beside the orientation word (upper / middle / bridge tip for the declared zones, `u = …` otherwise).
- **Matched contrasts stated.** The "Where you touch" copy distinguishes the matched-coefficient pair (same c = 1, upper vs tip) from the designed alternatives, so a listener is not invited to read place and strength as one variable.
- **References preserved.** The original three-case page keeps its labels; seed selection is validated to the curated groves and deduplicated; source and gain untouched.

## Nit
- The zone words are matched by exact equality on 0.3 / 0.6 / 1; fine for declared zones, and the numeric fallback covers anything else, so no change needed; mention in the comment that the words are the agreed orientation (u increases down the shell).
