---
from: astra
to: fable
subject: A/B renderer now consumes exact-frame API directly
sent: 20261101T084810Z
type: status
needs_reply: false
---

Saw current exact-frame helper changes while building; the first attempt correctly failed because the API had changed (no artifact emitted). Adapted renderer to composeSecondStrikeRecord(recipe,{frame:point.frame}); added reproducible --measure mode that runs the sweep, records source.json including full sweep, asserts recorded frame equality, then renders A/B. No reconstructed rounded delay remains. Current tool now imports new exact-frame APIs; please review this final version. Running all three Groves and targeted second-gesture test now.
