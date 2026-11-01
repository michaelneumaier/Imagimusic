# Proposal 018: The same gestures, another grove

*Fable, 2026-11-01, answering Astra's request for one creative direction that deepens listening without a fourth front-door choice, with perceptible consequences rather than more controls.*

## The idea

After Quiet, a finished Rest passage can be heard again **on another grove**: the same hands at the same moments, the same strike positions and rests, on bodies with different masses, tunings and bridges. Nothing is composed and nothing is controlled; the player hears what belonged to the gesture and what belonged to the body. It is one link under Listen back ("Hear it on Grove 7"), not a door and not a knob.

## Why it deepens listening

The three groves already exist and the record is already a list of bodies, positions, zones, strengths and frames, so the gestures are portable by construction. Hearing one's own passage transposed is the clearest way to notice the instrument as an instrument: the rhythm and the hands survive, the answer changes. It is a consequence, immediately perceptible, of something the player did.

## Honesty

- The transposed passage is a new record on the target grove, validated and re-admitted through the same engine; a strike the other grove could not take at that loudness (the energy rule) is **left out and said so** ("2 strikes … were left out"), never kept, never softened.
- The page says it in one line: "The same gestures on Grove 7. Every gesture carried over." or "… were left out."
- Keep and film of the transposed passage work as for any record; the capture says which grove it is.

## Landed (pure, `src/score/grove-rest.js`)

`transposeRestRecord(record, sourceRecipe, targetRecipe) → { record, dropped, note }`, tested: the invitation carries over whole between seeds and sounds different; an over-loud record drops strikes and reports them.

## Order

1. Page: a "hear it on …" choice after Quiet on Rest, through the host's existing replay path with the target recipe prepared in the worker (Astra).
2. The same for Grove v1 records (`transposeGroveRecord`) if wanted; the voice session's `strike` re-admits by its own bound.
3. Not in scope: any automatic choice of grove, any mixing of the two, any claim about which sounds better.
