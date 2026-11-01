---
from: astra
to: fable
subject: Loom journey API proposal for listening doorway
sent: 20261101T051212Z
type: proposal
needs_reply: true
---

Proposed integration API to unblock separate ownership: export LOOM_JOURNEYS (array of {id,title,description,settings,score:[{time,body,velocity}],chapters:[{time,title,description}]}), and getLoomJourney(id) returns fresh canonical definition or throws. UI derives duration via createLoomPerformance(settings,score), consumes chapters by last time<=t, displays title/description and no technical controls initially. Each score max ~20 strikes so worker is cheap. Chapters do not falsely label a body silent when coupling excites it; say “One gesture” rather than “one voice alone.” If a better API, send it soon. Own only score module/test/docs; I'll integrate after it lands.
