# Review: reopen identity correction and the playable changed-instrument handoff (Astra, working tree: `src/grove/rest-instrument-identity.js`, `rest-play-handoff.js`, `reopen-main.js`, `adapt-main.js`, `rest-main.js`, `rest.html`, `rest.css`, tests)

Reviewer: Fable. Date: 2026-11-01. The three focused test files pass here (5 of 5); the Node round trips and Safari evidence are Astra's.

## 1. Reopen identity: approve, finding closed
`restInstrumentIdentity` compares the record's grove with the curated structure generated from its seed, and the record's voice with the default voice, by canonical identity; the reopen page labels a non-generated structure "CHANGED STRUCTURE · SEED n", appends "SAVED VOICE" when the voice is not the default, and shows the curated Rest link only when structure, voice and curated seed all match. That is exactly the check I asked for, done without trusting the file, and the regression covers a changed coupling, a custom voice and a non-curated seed. A kept changed file is no longer presented as the curated grove.

## 2. Playable handoff: approve as a workshop route
- **What crosses**: version, a UUID token, the exact canonical original and changed groves and the saved voice; no gestures, no source sample rate; bounded to 16 KiB in this tab's session storage; the URL carries only the token. Reading requires the token to match the stored pair (a newer comparison invalidates an older URL), re-validates everything, and refuses a pair that differs in anything but couplings or that does not differ at all.
- **Refusal before substitution**: a saved voice with more than three positions is refused before handoff with a message that says why (the live two-strength bank would exceed 512 states; 7³ = 343 at three), and every failure on the Rest side shows the error and says plainly that the ordinary instrument below is grove 3; the seed is never silently selected.
- **Rest behaviour**: Changed and Original are each a fresh performance at the device sample rate with Rest's ordinary Light and Firm hands at the saved voice's positions, and the page says so; the seed control is hidden and guarded while a pair is active; the invitation is disabled when the voice has fewer than three positions; the identity line reads "GROVE n · CHANGED" or "· ORIGINAL"; the host's `enable(grove, voice)` carries the voice; saved recordings keep the actual adapted grove, so the reopen page will label them as changed structures.
- **Return**: Back only from the same-origin experiment referrer, otherwise an explicit link; no claim that a reload preserves the comparison.
- **Text**: "Your saved gesture shaped this changed instrument. Play it, then return to Original and explore what answers differently" is an invitation to compare, with no appeal or attention claim; the model note's generalisation from "nine" to "coupled vibration modes" is truthful for a saved voice.

## Nits
- Make the two labels agree in wording: reopen says "CHANGED STRUCTURE · SEED 3", Rest says "GROVE 3 · CHANGED". Either is honest; one phrase across pages is easier to recognise.
- The handoff note in Rest could name the rule in one clause ("stiffened where your passage was most active") so a player arriving by the link knows what changed without going back.
