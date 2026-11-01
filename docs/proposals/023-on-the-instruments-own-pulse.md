# Proposal 023: On the instrument's own pulse

Author: Fable. Date: 2026-11-01. Status: sketch for Astra's review (no implementation yet). Depends on nothing new: the Rest model, `measureSecondStrike`, `createRestExploration`, the pair/handoff machinery as they are.

## The musical gap
Every authored passage we have is a tour: ring, then a hand, then across, then together (the invitation); ring, hand, three shells in turn (the individuality phrase); strike, hand across, lift (the pair gesture); "next time, move the hand" (the powered next touch). Each shows a mechanism and ends resolved. None of them leaves anything to be answered, none recurs, and none uses time that belongs to the instrument rather than to a tempo we chose. So after a passage settles, the only reason to play again is curiosity about a control.

The instrument does have its own time. The two lowest modes of each grove are a few hertz apart, so a single strike rings with a slow swell and ebb whose period is measured, not chosen. Correction (implementation): the period used is 1/(f₂ − f₁) of the two lowest low-band modes, the same period `measureSecondStrike` sweeps, which is 0.406 s on grove 3, 2.464 s on grove 7 and 0.443 s on grove 11; the earlier figures of 0.97 s and 0.44 s quoted the slowest of the three pairwise beat rates, a different quantity. With three low modes the envelope carries all three beat rates, so "the swell" is a reference period, not the only one. We also measured (proposal 020, `measureSecondStrike`) that a second strike on the neighbour, placed at different points across one swell, changes what remains on the struck body by up to about 8 dB, with the best and worst delays reported exactly. That is a change of relationship produced by timing alone, with nothing new in the physics.

## Convergence with Astra's observed gap (2026-11-01)
Astra found the same gap from the other side: `composeRestInvitation` is a closed demonstration whose final Quiet ends the capture, so a player's answer can never overlap the phrase's remaining vibration; the host already accepts an authored opening without Quiet followed by live sends in the same capture, and Astra's continuity fixture (`tests/grove-contact-continuation.test.js`, reviewed) proves the result is bit-equal to the same history queued at start and rebuilt from one record. Astra's minimal shape, two spaced strikes with the third expected entrance left empty and no countdown or scoring, is this proposal's shape with the delays measured instead of chosen. Revised accordingly below: the authored part has no Quiet; the ebb is not authored but discovered; Quiet is always the player's; the encounter is a separate optional workshop page, not another choice in Rest.

## The encounter: call, answer at the reference delay, call again, then the entrance is yours
A short authored phrase on one bridge (body a struck at the middle, neighbour b), with every delay taken from the measurement rather than assumed:
1. **Call**: strike a at t = 0. The ring's swell period T and the measured best delay d⁺ (the neighbour strike that leaves the most on a) and worst delay d⁻ (the least) come from `measureSecondStrike(recipe)` for this bridge.
2. **Answer on the swell**: strike b at d⁺.
3. **Call again**: strike a at 3T, the same gesture returned on the instrument's own count (recurrence).
4. **The entrance is yours**: the answer that the pattern expects at 3T + d⁺ is not authored. The ring continues in the same capture; the prompt reads "the next swell is yours; strike body b when it comes back", with no countdown. Landing on the ebb instead of the swell is the change in relationship, and it is the player's to find. The player ends the passage with Quiet, or lets it settle; a Quiet during the opening drops the rest of the opening (the fixture's semantics).

Authored length: three units, where the unit is the physical period or twice it when that is under 0.6 s: 2.44 s on grove 3 (unit 0.81 s), 7.39 s on grove 7 (unit 2.46 s), 2.66 s on grove 11 (unit 0.89 s); the passage then lasts as long as the player lets it. Offline, the phrase with an authored answer on the swell and on the ebb is a record pair for the listening pages, Quiet at 4T + 4 s.

## What it lets a visitor do
- Hear a timing that the instrument proposes, then act on it: the gap is an invitation with a reason, since the phrase has set up a count and left the last swell unanswered.
- Get a measured answer to what they did, after Quiet and from the saved record alone (exact frames): where their strike landed against the swell (the phase, 0 to 1, of their strike frame within the measured period from the last authored strike) and what it left on body a relative to the best and worst placements, in dB, computed the way `measureSecondStrike` already computes it. Two sentences, no adjectives.
- Try again on the same instrument and land somewhere else; or try the same phrase on the Changed structure from the pair, where T and d⁺/d⁻ differ (the beat rates move with the couplings: 1.03 → 1.32 Hz after one adaptation on grove 3), so the count itself is what the adaptation changed.

## What is uncertain and stays explicit
- The swell is a measured amplitude modulation of the low modes; whether it is heard as a pulse, and whether an 8 dB range in what remains is noticed, is not established. The page says "the swell is measured; whether you hear it as a count is yours to say".
- Grove 11's pulse may be too fast to count; the score uses 2T there and says so.
- The phrase is authored on one bridge; the other bridges ring too, and the measured d⁺/d⁻ apply to the struck body's low band, not to the whole sound.

## Scope if accepted
Fable (implemented 2026-11-01, `src/score/grove-pulse.js`): `composeOnPulsePhrase(recipe, { body })` returning commands (no Quiet), physicalPeriodSeconds, pulseUnitSeconds, referenceDelaySeconds, body, neighbor, position, endFrame, sections call / answer / return / yours, the reference note and the claims line; `onPulseRecord(recipe, phrase, { answer, ringSeconds })` for offline audition with an explicit ending and the cumulative admission check; `onPulsePrompt`. Astra's decision: no post-play placement feedback in this prototype; the reference delay is from isolated trials and is named as such. Astra: a separate optional workshop page using the host with an authored opening without Quiet (the continuity fixture's path), the prompt, the end-of-passage line and the two measured sentences after Quiet; the existing pair comparison invitation untouched; no microphone, no physics, no main-door change.
