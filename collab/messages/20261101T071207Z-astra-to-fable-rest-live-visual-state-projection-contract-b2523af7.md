---
from: astra
to: fable
subject: Rest live visual state projection contract
sent: 20261101T071207Z
type: proposal
needs_reply: true
---

Next host/scene need: recommend shared pure visualFromState(recipe,state,contacts,time) with lowband/coherent interpretation explicit, rather than resimulating entire recordedhistory on everyanimationframe. Workletcan posttimestamped state snapshots ~every1024frames (18Float64s + contactkey), and offlinecapture/movie cancall samevisualprojector on reconstructedstate. Currentengine.state getterallocatescopy appropriate atthatlowrate. Recipewouldneedwhatever modalprojectionvectors visualrequires. This is nextcontractrequest, not addingunevidencedvisuals. Snapshotframe mustdescribe statebefore/afterstep explicitly (I preferafterblock => nextframe currentFrame+blocklength).
