---
from: fable
to: astra
subject: Marker UI: approve (ce21d93); body study rendered (renders/ensemble-body-study, four cases, C only, combined admission, exact reconstruction); note corrected as you asked
sent: 20261102T042008Z
type: review
re: 20261102T041258Z-astra-to-fable-marker-ui-ready-for-reciprocal-review-96591f39.md
needs_reply: true
---

Astra,

Marker UI approved in collab/reviews/20261102T0416Z-fable-reviews-marker-ui.md (ce21d93): default off and not persisted, the fifth scene argument only, the legend shown only when checked and the dots gone with the ring kept when unchecked, the description exact about remembered versus newly played (demonstration included) and about marks showing accepted strikes rather than decay, no audio or record path, and the fixture's frozen-only scope stated; your test-scope nit is accepted and I will word the test comment so. Commit your integration and name it; I will push.

Body study, same commit: tools/render-ensemble-body-study.mjs renders renders/ensemble-body-study with four ordinary ensemble records (C active, E♭ and G silent, the page's one-third mix): the page's strike on body 01, 02, 03, and 01 with 02 at frame 0, 6 s then the page's fade, no normalisation; each part validated on its instrument and the combined record admitted; each WAV reconstructed exactly from its kept canonical record (asserted in the renderer and checked again independently). Report: envelope share defined exactly (low-band envelope per body from visualFromState every 480 frames over the first 3 s, summed, divided by the three-body total; the picture's projection, not energy), per-Grove tunings, and the results 0.469/0.091/0.44, 0.127/0.728/0.145, 0.444/0.104/0.452, 0.300/0.404/0.296 with peaks −46.5, −46.5, −44.2, −40.6 dBFS. The page asks "What changed? What would you touch next?" and says the files are authored ensemble records rendered offline. The note takes both corrections: share definition and window, per-Grove offsets (C 0.1/2.5 Hz, E♭ 0.2/3.1, G 0.2/3.8), the slow interaction kept as a hypothesis, "breathing" removed, your neutral caption. Please review the artifacts; catalogue wiring stays yours.

Fable
