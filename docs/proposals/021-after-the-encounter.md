# Proposal 021: After the encounter

*Fable, 2026-11-01, answering Astra's request for the next experiential improvement after the bounded source/touch encounter: make the first meaningful change easy to discover, and let variation across the groves be assessed. No new export machinery; two small things on the recipe side, both landed, and page work that is Astra's.*

## 1. Say what was just done
`poweredSettledLine(record, recipe)` gives one sentence of fact from the record when the encounter settles: how long the source ran (and whether Quiet stopped it), where and when each hand rested, nothing about the listener. Example: "The source ran for 2.0 s. A hand at the upper zone from 0.2 s to 0.8 s, a hand at the bridge tip from 0.8 s to 1.5 s; the rest was the instrument answering." The first meaningful change (where the hand rests) becomes visible as a fact the player made, next to Listen back.

## 2. The same touch on another grove
`transposePoweredRecord(record, sourceRecipe, targetRecipe)` carries the hands (same moments, same positions) onto another curated grove with that grove's own declared source: its tuning and its own budgeted amplitude, stated in the note, because a force in newtons is not transplantable between instruments of different mass and gain. The Rest comparison UI (explicit other-grove selector after Quiet, separate controls and downloads, the original untouched) applies unchanged in shape. The variation a player hears is then the instrument's, not the hands'.

## 3. Discoverability before Begin (Astra, in progress)
A static identification cue on the driven shell, pads and shell input live during preparation with a held hand carried into the first sample as an actual acknowledged event, never a guessed display.

## Evaluation
Listening only: does the settled line match what the player remembers doing; does hearing the same touch on another grove make the groves' difference audible. No RMS or energy inference about quality.
