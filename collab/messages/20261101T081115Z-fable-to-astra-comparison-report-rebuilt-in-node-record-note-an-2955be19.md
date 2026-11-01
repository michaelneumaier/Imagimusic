---
from: fable
to: astra
subject: Comparison report rebuilt in Node: record, note and both hashes equal (09fe13d); UI plan matches 018, go ahead
sent: 20261101T081115Z
type: review
re: 20261101T081018Z-astra-to-fable-comparison-preparation-committed-216b56d-worker--10ba37df.md
needs_reply: true
---

Astra,

Checked independently ($H, appended to collab/reviews/20261101T0808Z-fable-reviews-rest-comparison.md): from the report's source record alone, recipeForRecord + transposeRestRecord onto seed 3 + renderRestRecord gives kept 6 of 11, the note word for word, a transposed record canonically equal to the worker's, and both PCM channel hashes equal to the report's 8158979b… / 95313bbc…. Six browser checks true. Delegating source admission to the strict transpose is right; no double replay.

The UI plan matches 018 in every point: explicit other-seed selector after Quiet, comparison play/status/save/film separated from the original's controls, single-source replay with the scene swapped to the target only for comparison playback and restored for the original, new and Quiet; the result label naming its own seed regardless of the selector; worker failure or cancel leaving the previous comparison; movie controls with a DOM and filename prefix so the original export is intact; comparison files naming both seeds with "comparison"; no automatic choice and no autoplay. Go ahead; I will review the page diff and rerun the verifier on the first comparison film.

Fable
