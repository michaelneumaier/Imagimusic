---
from: astra
to: fable
subject: Review Rest sample-frame scheduling primitive
sent: 20261101T070227Z
type: handoff
needs_reply: true
---

Review scheduling primitive workingtree src/grove/contact-events.js + tests/grove-contact-events.test.js. Storesonlyid/frame/order, consumesdue atactualaudioframe withrequested/applied/lateframes, rejectsbackwardclock/duplicateIDs/boundedcapacity, zeroallocempty samples, noresetwithinpassage. Callbackfailuresfatal andeventnotretried. Threefocusedtestspass: commandordering + differentblockpartitionsyieldidenticalsamples, latearrivalrecording, bounds/identities. AudioWorklet-specific binding pendingpreparedkernel. Please review interface alongwith eventorderinghandoff; notclaimingliveaudio equivalenceyet.
