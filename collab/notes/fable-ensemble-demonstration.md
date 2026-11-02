# Three Groves: the smallest useful demonstration, and the interaction trade-off (Fable, 2026-11-02; proposal only, no code)

## The phrase
The ensemble phrase already in `src/score/grove-ensemble.js` is the right material; the demonstration is that phrase without its chord, played with the page's own press. Tempo 72, one beat 0.833 s:

| beat | voice | gesture | what it shows |
|---|---|---|---|
| 0 | C | strike body 1, middle, velocity 0.5 | the first voice alone |
| 1 | E♭ | strike | a second voice entering a ring that is still there |
| 2 | G | strike | the third; the harmonic outline complete, nothing coupled |
| 3.5 to 6 | C | firm hand at the last zone, then lift | one voice softened while the other two continue; on lift, what remains of C |
| 8 | all | Quiet with the 25 ms fade | the common ending |

About 6.7 s. Every command is the same kind the person's buttons send (strike at the middle at 0.5; the firm hand at the last zone), through the same engine with the same acknowledgements and admission, so the demonstration shows exactly what a press does and nothing a press cannot do. I would add `composeEnsemblePhrase(recipes, { together: false, velocity: 0.5 })` to my module so the page composes it from the same source as the study, with sections arrive / hand / ring / quiet; the page's commands stay authored by the score, never by the page.

The measured fact the hand step rests on: a firm hand on the struck body drops that body while its two cluster neighbours hold or rise (0 / 0.94 / 1.41 relative on grove 3, tuning-invariant), and the other two voices are untouched because nothing couples the groves.

## The trade-off
**A. A separate, labelled demonstration passage, kept until "Your turn" (recommended).** "Show one gesture" starts a fresh passage marked DEMONSTRATION in the phase line, plays the phrase, ends with its own Quiet, and leaves the page showing "Your turn", which begins a new empty passage. The demonstration's record is never offered as the person's own (either not keepable, or keepable under the name demonstration); strike and hold during it are refused with one line ("this is the demonstration; Your turn begins your own passage"), so authored gestures and personal gestures can never share a record. Cost: one more state and one more button; a person who wants to answer the demonstration's ring cannot, by design.

**B. An action available only in an empty session.** The demonstration plays into the person's current passage when nothing has been played yet, and the person can answer into its remaining ring, as the open phrase does. Cost: the kept record then contains authored gestures mixed with personal ones, which the page would have to mark per event and the readers would have to show; the ensemble record has no field for that, and adding one is a schema change to the kept format for a convenience.

Recommendation: A. The open phrase already offers "an authored opening you answer into", deliberately, in one capture; Three Groves is the page whose point is the person's own first touch, and its kept files are the ensemble's provenance. Keep the two encounters distinct rather than making Three Groves a second open phrase. If answering into the demonstration's ring turns out to be what people want, that is a finding for the open phrase's successor, not a reason to blur the ensemble's records.

## Labelling and the first minute
"Show one gesture" sits beside Begin, secondary, never automatic; the phase line reads DEMONSTRATION while it plays; the status names each step as it is acknowledged ("C alone", "E♭ enters", "G enters", "a hand on C; the others continue", "lifted"), from acknowledgements, not from the schedule; then "Your turn" and the ordinary first-minute text. Reduced motion and the listening level apply as to any passage.
