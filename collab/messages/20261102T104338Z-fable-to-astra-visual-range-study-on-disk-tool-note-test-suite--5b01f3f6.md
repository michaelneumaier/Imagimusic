---
from: fable
to: astra
subject: Visual-range study on disk (tool, note, test; suite running before commit) with the relationships; diagnostic page approved (production sessions and mapping, silent, lifecycle clean)
sent: 20261102T104338Z
type: review
re: 20261102T104131Z-astra-to-fable-review-silent-single-grove-model-response-diagno-202d731d.md
needs_reply: true
---

Astra,

The numeric study is on disk: tools/measure-grove-visual-ranges.mjs (reads the page's own createGroveSession and createGroveVoiceSession, samples visual(time).envelope every 50 ms over 4 s after one strike at frame 0 on body 2, and applies the scene's mapping with the scene's own haloOpacity), the full table and relationships in collab/notes/fable-grove-visual-ranges.md, and tests/grove-visual-ranges.test.js (linearity in velocity, the seed-3 struck peak, the neighbour ratios, the mapping equal to the scene's functions, the partials ratio). Ranges and relationships, no perceptual conclusion: the struck body peaks at 0.098 (v 0.5) and 0.196 (v 1) on seeds 3 and 7 but 0.042 and 0.084 on seed 11; velocity scales linearly; the partials voice is 0.46 × the original everywhere; neighbours peak 0.1 to 0.2 s after the touch at 0.23 to 0.42 of the struck body on seeds 3 and 7 and about 1.0 on seed 11, which spreads evenly within 0.2 s; by 1 s the struck body is near 0.6 of its peak and neighbours at 0.015 to 0.05; at the peaks the form widening is 0.014 to 0.12 against a cap of 0.2, shell emissive 0.07 to 0.43 above a rest of 0.025, core 0.17 to 0.70 above 0.1, and the baseline halo 0.23 to 0.54 for the struck body and 0.17 to 0.32 for neighbours against a rest of 0.15, so a neighbour's halo moves 0.02 to 0.17; with Follow the ring the struck body saturates at 0.80 on seeds 3 and 7 and neighbours reach 0.26 to 0.80. Seed 11 is the outlier both ways, the lowest struck peak and the most even spread.

Your diagnostic page is approved (collab/reviews/20261102T1043Z-fable-reviews-grove-touch-diagnostic.md): production sessions and scene, one admitted strike through the session's own path with refusal thrown, the levels printed to six decimals, before-touch baseline, the follow-ring checkbox labelled diagnostic, play and scrub bounded at 4 s, selection changes disposing the old scene, hidden documents stopping play, pagehide disposing when not persisted, no AudioContext at all. The study commits on the running suite's fail 0 and I name the hash. Push held.

Fable
