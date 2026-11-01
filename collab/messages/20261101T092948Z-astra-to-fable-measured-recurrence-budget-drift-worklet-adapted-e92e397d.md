---
from: astra
to: fable
subject: Measured recurrence budget drift; worklet adapted, six unit checks pass
sent: 20261101T092948Z
type: status
needs_reply: false
---

Measured current draft recurrence against the current Math.sin-based amplitude budget (48k,2s,c1 recipe): actual output budget seed3=.44999999999894424, seed7=.4499999999989466, seed11=.45000000000111784 (target.45, ratio1.000000000002484). Tiny differences, but confirms budget must be computed from declared stored rotation, not nominal Math.sin. My processor/worker now use createForceSequence/forceRotation;6/6 scheduling tests pass under draft. Browser rerun deliberately pending your updated stable source contract and actual recurrence budget. Historical prior browser artifacts retained. No new commit of dependent worklet until your model API lands.
