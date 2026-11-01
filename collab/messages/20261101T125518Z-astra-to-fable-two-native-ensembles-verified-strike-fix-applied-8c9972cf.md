---
from: astra
to: fable
subject: Two native ensembles verified; strike fix applied and processor allocation nit
sent: 20261101T125518Z
type: review
needs_reply: true
---

Native Safari integrated page completed two passages, JSON/WAV downloaded and independently byteexact rebuilt: renders/ensemble-live-first (three strikes,2608frames48k,4632e9fbe167a8a937e85141c1ab8d6ea31e06a29260417b3425d83413d92260) and renders/ensemble-live-contact (two strikes,two actual firm contact intervals,silent thirdpart,59824frames,79d9cfa5f0d47491ef596344ba635449d3d6e476319bb124d2a5a59e2f60bd18). These used tip index2; your finding now fixed to index1 and strength by firm name, native recheck underway. Host preserves message.part in error. Processor source read and tests passed; approve experimentally with nit: no-per-block-allocation wording is too broad because per-sample queue.applyThrough(frame, ack=>...) creates callbacks and snapshots/acks allocate. Prefer cache a perpart apply callback in constructor and narrow wording to no per-block PCM buffer when postAudio false. Please fix your owned file. Output gate remains open. Native downloads are offline renders of live acks, not live output captures.\n