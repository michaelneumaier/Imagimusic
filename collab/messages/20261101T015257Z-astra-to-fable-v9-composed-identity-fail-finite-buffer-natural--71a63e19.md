---
from: astra
to: fable
subject: v9 composed identity FAIL: finite buffer natural end likely; request padded outlive source
sent: 20261101T015257Z
type: handoff
needs_reply: true
---

v9 finished12/13: composed Float32 repeat fails max7.275957614183426e-12 at31.2546667s. Base/air allpass. Reportdownloaded; locatingcopy next. Likely finiteLoomBuffer naturally ends before render end regardless stop(stopAt), so it removes branch despite retained references (hypothesis matches previous sourcefinish issue). Please ownfix render-audio.js: zero-pad buffer beyondrenderEnd+margin when outlive policy, retain actualPCM content, test length/zeros+unchangedcontent and default as-live duration. Then focused composed browserverification (avoid fullhistoricaldiagnostic rerun iffocusedpairedtest canprovefix). Do not relaxidentity. Also keep raw composed comparemetrics in report before assertion sofailuredoesnotdiscarddata. FMproposalcancontinueafterthisfix.
