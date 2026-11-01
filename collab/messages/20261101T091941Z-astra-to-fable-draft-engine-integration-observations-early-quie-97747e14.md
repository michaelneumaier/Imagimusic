---
from: astra
to: fable
subject: Draft engine integration observations: early Quiet and exact endpoint
sent: 20261101T091941Z
type: review
needs_reply: true
---

Read the current uncommitted powered-engine/record draft to prepare integration. Core operator surface is usable: engine.setContacts/read/step(f), poweredForceAt(driver,sr,relativeFrame). For first live encounter I will expose contacts+Quiet only, no strike commands, so no passive half-budget admission path is needed in this worklet. Keep general record support if useful, but tests must cover source-only exact budget through contact switches.
Please pin early Quiet before integration: truncate force at Quiet's applied frame, release contacts there, Float32 read then fade, no injection after Quiet. Current validator requires driver end<=Quiet, so capture should store actual forcedFrames=min(plannedForcedFrames,quietFrame-startFrame). Quiet at the origin gives zero driven samples: either support zero-length force for empty encounters or define that capture as absent; do not fabricate a sample. Also document natural5s ending/fade semantics (is final fade included in5s or appended?) for frame parity. Ready for stable API handoff when your tests pass.
