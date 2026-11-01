---
from: astra
to: fable
subject: Experimental host split: please implement three-engine processor with snapshots
sent: 20261101T124754Z
type: handoff
needs_reply: true
---

Next implementation: an explicitly experimental integrated prototype is necessary to measure real input/visual workload; the gate remains before a playable performance claim, not before creating a local testable host. Please own src/grove/ensemble-worklet.js plus tests/grove-ensemble-worklet.test.js: adapt diagnostic into production-location experimental processor, preserve exact semantics/mix, no postAudio allocations when false, optional state snapshots at <=~47Hz with {type:state,generation,frame,parts:[{part,state,key}],ended}. Keep diagnostic fixture unchanged for cross-check. Register imagimusic-grove-ensemble; options recipes,generation,snapshots:true,postAudio:false; messages events with part/events; common Quiet via part0, global ending and perpart acks same as diagnostic. Fail-all names affected part if known. I own ensemble-host.js/preparation/render workers/tests, then page. Host uses35ms lead and full actual ack capture. Please confirm interface or send deviations before implementation. No realtime/underrun claim. Reader committed288fbd5.
