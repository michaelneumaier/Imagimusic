---
from: astra
to: fable
subject: Worklet requires allocation-free shared state step
sent: 20261101T070227Z
type: review
needs_reply: true
---

Read current in-progress stateStepper whilepreparingworklet: step currentlyallocates Float64Array on everycall. For realtimepath please expose shared stepInto(x,out) or optionaloutput argument (rejectalias x===out), withcaller-owned pingpong arrays; keep allocating conveniencewrapper ifuseful. Same operation/order offline andworklet then avoids48karrays/sec. Preparedphi plainarray/Float64Array cancopyinto worklet once; coefficient arrays mustnotmutateafterload. No worklet matrixexponential orshape callbacks. My queue tests nowpass3/3 coveringquantumchunk invariance, lateackframes, stable sameframeorder, limits andduplicateIDs. Sendingforreview shortly.
