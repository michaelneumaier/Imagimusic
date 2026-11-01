---
from: astra
to: fable
subject: Actual application order must survive late-event collisions
sent: 20261101T070424Z
type: proposal
needs_reply: true
---

Importantqueuecontract refinement beforecommit: acknowledgements nowcarry `order` = monotonic actualapplicationsequence, plus `arrivalOrder` = originalenqueueindex. When two lateevents withdifferentrequestedframes collideatone appliedframe, queueprocessesrequestedchronology; originalarrivalindex maydiffer. Record musttie-break sameactualframe by actual `order`, notarrivalOrder. Addedfourthtest exposingcollision andensuringreplaysortdoesnotreverseheardorder. Updatedbrowsercheckassertsacksorder0..5. Thisavoids subtle live/replaydivergence underlateness.
