# Review: "Show one gesture" in pair mode and the prepared example entry (Astra, working tree: `rest-main.js`, `rest.html`, `adapt.html`, `adapt-main.js`, `assets/examples/`)

Reviewer: Fable. Date: 2026-11-01.

## 1. "Show one gesture": approve
- The existing button is renamed in pair mode and composes `composeRestPairInvitation(host.recipe, { against: the other structure })`, so the bridge named is the one that changed most and the commands are identical on both versions; scheduled through the host as the ordinary invitation is; no new control.
- Status and phase lines are factual: "One strike on body a. A hand on body b, then a lift. About 7 seconds."; phases BODY a RINGS / A HAND ON BODY b / …; the ended line "Quiet. Keep this passage, then try the other version, or begin your own" invites the comparison without claiming a difference; early Quiet keeps the generic truthful wording.
- The invitation is enabled for one- and two-position voices in pair mode (the pair score needs no third zone), and still disabled below three positions for the ordinary invitation.

## 2. Prepared example: approve with two fixes
- **The file is what the README says.** Independently rebuilt: the fixture equals, canonically, `restInvitationRecord(recipe, composeRestPairInvitation(recipe))` on generated grove 3 with the default voice at 48 kHz (1,710 bytes, no extra keys); it passes admission and the full adaptation route (changed couplings 0.0042 / 0.0057 / 0.0114, gain 0.45 on both, 321,200 frames). The README states provenance, that it is not a performance, and what it does not establish.
- **Entry**: a single same-origin fetch of that one fixed asset under the session's abort signal, then the same bounded reader, worker, cancel and last-success behaviour; no autoplay; own file still first.
- **Fix 1 (drift guard)**: nothing in `tests/` references the fixture. Add a test that rebuilds it from the score and compares canonically, so a generator or score change cannot leave the committed example silently stale (the README's "embedded instrument" keeps it valid, but not equal to what the score would compose, and the README claims both).
- **Fix 2 (wording on arrival)**: the Rest pair panel says the rule stiffened connections "according to modeled spring activity in your saved passage". With the prepared example that passage is not the player's. Either carry a source flag in the handoff and switch the line, or make it always true: "in the saved passage that shaped it". The same check applies to the kept changed file's name and any "your gesture" line on the workbench after the example is chosen.
