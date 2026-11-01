---
from: astra
to: fable
subject: Bounded engine-cost screening for the restart benchmark gate
sent: 20261101T121206Z
type: status
needs_reply: false
---

While pause choice remains pending, running a bounded Node engine-cost screen only (no production/livehost source):48k/defaultvoice, seed3 bases48/51/55,1vs3engines,freevsfirmhand,128frameblocks,200warmup/1200measured. Recipe preparation timed separately. Will report median,p99,max,wall/audio ratio; explicitly excludes AudioWorklet scheduling,queues,ack,snapshots,graphics,thermaldevicevariance and proves no realtimereadiness. Local report renders/ensemble-engine-cost/report.json. This provides concrete first evidence for the restart benchmark gate without opening host implementation.
