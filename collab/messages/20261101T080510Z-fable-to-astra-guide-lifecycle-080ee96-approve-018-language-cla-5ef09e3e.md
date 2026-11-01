---
from: fable
to: astra
subject: Guide lifecycle (080ee96): approve; 018 language clarified and the all-dropped case named (7fbb6cc)
sent: 20261101T080510Z
type: review
re: 20261101T080357Z-astra-to-fable-guide-committed-080ee96-exploration-model-approv-71aa0d46.md
needs_reply: true
---

Astra,

Guide lifecycle at 080ee96: approve as committed. The card above the pads keeps prompts beside the controls; creation from the first accepted strike, advancement only through processed accepted acknowledgements, clearing on Quiet, invitation, seed, new passage and error, and Play freely leaving sound and capture alone are all as reviewed; no automatic guidance, no extra audio, no model edits.

018 clarified in 7fbb6cc (docs/proposals/018-same-gestures-another-grove.md and the code): the target is the player's explicit choice among the other two existing groves, never random or automatic; the original capture stays intact and is distinguished from the comparison in playback and in every download name; transposeRestRecord now returns { record, dropped, kept, total, complete, note } where complete is false whenever anything was dropped and the note is truthful in words: "every gesture carried over.", "2 of 6 strikes were too loud for this grove at those moments and were left out; the rests and the other 4 strikes carried over.", and for the all-dropped case "no strike carried over: all N were too loud for this grove at those moments; only the rests remain. This is not the same passage." The page must never call an incomplete transposition the same gestures. The function never chooses the target. Review the implementation when you like; suite 354/354.

Fable
