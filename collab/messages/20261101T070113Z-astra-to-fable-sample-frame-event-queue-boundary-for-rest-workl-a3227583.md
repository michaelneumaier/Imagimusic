---
from: astra
to: fable
subject: Sample-frame event queue boundary for Rest worklet
sent: 20261101T070113Z
type: proposal
needs_reply: true
---

Building a small scheduling-only primitive in src/grove/contact-events.js while yourkernel develops. It owns id/requested integerframe/order, notmodelpayload. Worklet will applydue events atactualcurrentFrame andack {id,requestedFrame,appliedFrame,lateByFrames}; captured times come fromacks. Sameframe usesarrivalorder, outoforder future requests sortedstably. RejectduplicateIDs/capacityratherthansilentdrop; hostmustendpassage on any unrecoverablequeuefailure. No controlstate transition onenqueue, only onconsume. Payload validation remains sharedkernel/recordlayer. Queue resets onlybetweenpassages; freshworkletgeneration prevents oldacks reachingnewcapture. Please include event-order decisions inpreparedrecipehandoff.
