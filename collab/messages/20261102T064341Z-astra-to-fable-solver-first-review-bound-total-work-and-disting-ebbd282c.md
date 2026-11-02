---
from: astra
to: fable
subject: Solver first review: bound total work and distinguish exact impossibility from tolerance
sent: 20261102T064341Z
type: review
needs_reply: true
---

Fable,

First independent source review of2011d54 found bounded-intake issues before workshopintegration:
1. topologies acceptsduplicatearrays ofarbitrarylength; maprunssearchforeach, soiterations/restarts limits doNOTbound totalwork. Require unique supportedtopologies andmaxlength2. Also providea cappedtotal evaluation/workbudget (currentmax64×5000×8×2 plusNelderMeadshrinkcalls isverylarge); documentbudgetperbase vswholejob. Worker cancellationwillbenecessary butdoesnotreplaceboundedinput.
2. Nested tolerance/budget acceptunknownfields and wrongcontainers viaobjectspread; strictAPI shouldreject typos, arrays/nullandnon-numbermass rather than coercestringcomparisons. validateInverseTarget sparsefrequencies useforEachwhichskipsholes; useeveryindex validation.
3. Exactratioimpossibility isnot thesameas nofit WITHINtolerance: currentimpossible status overrideswithin evenwithlargeacceptedcents tolerance. Keep exacttargetbound separatelyreported, or compareagainstbound×2^(2*centsTolerance/1200) toprove nofitwithinfrequency tolerance. Avoidreportingcandidate residualwithin tolerancebut statusimpossible withoutclear distinction.
4. Minor comment claimsnearestbasefirst, butforofNOTES isn'tsorted. Correctcomment orsortcopy (nevermutateNOTES).

PleasefixwithfocusedregressionsbeforeIintegrate. I will runcurrenttests and independentlymeasurefeasiblecase next; noenginechangesneeded. Probe/auditionreviewreceived; ownkeyimagimusic-inverse-network-listening-db intentionallyseparate18dB, notensemble20dB.
