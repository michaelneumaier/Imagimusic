# Proposal 023: On the instrument's own pulse

Author: Fable. Date: 2026-11-01. Status: sketch for Astra's review (no implementation yet). Depends on nothing new: the Rest model, `measureSecondStrike`, `createRestExploration`, the pair/handoff machinery as they are.

## The musical gap
Every authored passage we have is a tour: ring, then a hand, then across, then together (the invitation); ring, hand, three shells in turn (the individuality phrase); strike, hand across, lift (the pair gesture); "next time, move the hand" (the powered next touch). Each shows a mechanism and ends resolved. None of them leaves anything to be answered, none recurs, and none uses time that belongs to the instrument rather than to a tempo we chose. So after a passage settles, the only reason to play again is curiosity about a control.

The instrument does have its own time. The two lowest modes of each grove are a few hertz apart, so a single strike rings with a slow swell and ebb whose period is measured, not chosen: about 0.97 s on grove 3 (1.03 Hz), 2.4 s on grove 7 (0.41 Hz), 0.44 s on grove 11 (2.26 Hz). We also measured (proposal 020, `measureSecondStrike`) that a second strike on the neighbour, placed at different points across one swell, changes what remains on the struck body by up to about 8 dB, with the best and worst delays reported exactly. That is a change of relationship produced by timing alone, with nothing new in the physics.

## The encounter: call, answer on the swell, call again, answer on the ebb, then the gap is yours
A short authored phrase on one bridge (body a struck at the middle, neighbour b), with every delay taken from the measurement rather than assumed:
1. **Call**: strike a at t = 0. The ring's swell period T and the measured best delay d⁺ (the neighbour strike that leaves the most on a) and worst delay d⁻ (the least) come from `measureSecondStrike(recipe)` for this bridge.
2. **Answer on the swell**: strike b at d⁺.
3. **Call again**: strike a at 3T, the same gesture returned on the instrument's own count (recurrence).
4. **Answer on the ebb**: strike b at 3T + d⁻, the same answer landing on the opposite phase (the change in relationship).
5. **The gap**: nothing. The ring continues. In Rest the prompt reads: "The next swell is yours. Strike body a when it comes back." The passage is not ended by the score; the player ends it with Quiet, or lets it settle.

Length: about 4T plus the ring, so roughly 8 s on grove 3, 14 s on grove 7, 6 s on grove 11 (on grove 11 the pulse unit would be 2T, since 0.44 s is fast for a count; stated in the score). Offline, the same phrase is a record for the listening pages with Quiet at 4T + 4 s.

## What it lets a visitor do
- Hear a timing that the instrument proposes, then act on it: the gap is an invitation with a reason, since the phrase has set up a count and left the last swell unanswered.
- Get a measured answer to what they did, after Quiet and from the saved record alone (exact frames): where their strike landed against the swell (the phase, 0 to 1, of their strike frame within the measured period from the last authored strike) and what it left on body a relative to the best and worst placements, in dB, computed the way `measureSecondStrike` already computes it. Two sentences, no adjectives.
- Try again on the same instrument and land somewhere else; or try the same phrase on the Changed structure from the pair, where T and d⁺/d⁻ differ (the beat rates move with the couplings: 1.03 → 1.32 Hz after one adaptation on grove 3), so the count itself is what the adaptation changed.

## What is uncertain and stays explicit
- The swell is a measured amplitude modulation of the low modes; whether it is heard as a pulse, and whether an 8 dB range in what remains is noticed, is not established. The page says "the swell is measured; whether you hear it as a count is yours to say".
- Grove 11's pulse may be too fast to count; the score uses 2T there and says so.
- The phrase is authored on one bridge; the other bridges ring too, and the measured d⁺/d⁻ apply to the struck body's low band, not to the whole sound.

## Scope if accepted
Fable: `composeOnPulsePhrase(recipe, { body })` in `src/score/grove-rest.js` returning the phrase (commands, sections call / swell / call / ebb / yours, T, d⁺, d⁻, the measured range) and `describePulsePlacement(record, recipe, phrase)` returning the phase and the relative level of the player's strike, both pure and tested; the record form for the listening pages. Astra: the Rest prompt and the end-of-passage line, through the existing invitation button and exploration state, no new control; no microphone, no physics, no main-door change.
