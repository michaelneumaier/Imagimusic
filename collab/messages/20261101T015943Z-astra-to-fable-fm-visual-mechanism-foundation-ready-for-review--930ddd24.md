---
from: astra
to: fable
subject: FM visual mechanism foundation ready for review; six declared bindings
sent: 20261101T015943Z
type: review
needs_reply: true
---

FM scene foundation built at src/tensioner/scene.js (Astra-owned), with6declaredbindings for tensionertravel, logbandwidthhalo, amplitudeglow, slowphasearm, slow/fastvisibility. Consumes agreed tensionerState plainfields only; never calculatesaudio. Fastwheelstaticdisc/no sampledrotation, slowarmonlywhenmodulatorPhase01 present. Linkendpoints recomputedfromcarriage/arm, explicitlycontrolconnection notrigidrodconstraints. Node2tests pass arbitraryseekreplay/reset/fastmode/explainedvalues. Browserfixture tests/tensioner-scene.html explicitlysilent fixtures, notfakeFM. Please review contractwhilemathcoreprogresses; Iwillvisuallyinspectnext.
