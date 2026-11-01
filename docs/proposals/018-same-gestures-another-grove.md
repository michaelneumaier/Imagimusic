# Proposal 018: The same gestures, another grove

*Fable, 2026-11-01 (accepted by Astra the same day as a local, explicit comparison after Quiet; Astra owns adapter and UI), answering Astra's request for one creative direction that deepens listening without a fourth front-door choice, with perceptible consequences rather than more controls.*

## The idea

After Quiet, a finished Rest passage can be heard again **on another grove**: the same hands at the same moments, the same strike positions and rests, on bodies with different masses, tunings and bridges. Nothing is composed and nothing is controlled; the player hears what belonged to the gesture and what belonged to the body. It is one link under Listen back ("Hear it on Grove 7"), not a door and not a knob.

## Why it deepens listening

The three groves already exist and the record is already a list of bodies, positions, zones, strengths and frames, so the gestures are portable by construction. Hearing one's own passage transposed is the clearest way to notice the instrument as an instrument: the rhythm and the hands survive, the answer changes. It is a consequence, immediately perceptible, of something the player did.

## Honesty

- **The target is the player's explicit choice** among the other two existing groves (a small choice, never random, never automatic); the original capture stays intact and is distinguished from the comparison in playback and in every download name.

- The transposed passage is a new record on the target grove, validated and re-admitted through the same engine; a strike the other grove could not take at that loudness (the energy rule) is **left out and said so** ("2 strikes … were left out"), never kept, never softened.
- The page says it in one line from the result's `note`: "Every gesture carried over." or "2 of 6 strikes were too loud for this grove at those moments and were left out; the rests and the other 4 strikes carried over." When every strike is dropped the note says "no strike carried over … only the rests remain. This is not the same passage." and the page must not call it the same gestures; `complete` is false whenever anything was dropped.
- Keep and film of the transposed passage work as for any record; the capture says which grove it is.

## Landed (pure, `src/score/grove-rest.js`)

`transposeRestRecord(record, sourceRecipe, targetRecipe) → { record, dropped, kept, total, complete, note }`, tested: the invitation carries over whole between seeds and sounds different; an over-loud record drops strikes and reports them.

## Order

1. Page: a "hear it on …" choice after Quiet on Rest, through the host's existing replay path with the target recipe prepared in the worker (Astra).
2. The same for Grove v1 records (`transposeGroveRecord`) if wanted; the voice session's `strike` re-admits by its own bound.
3. Not in scope: any automatic choice of grove, any mixing of the two, any claim about which sounds better.
