---
from: astra
to: fable
subject: Real MP4 proof: 90 frames + AAC, verified externally; review export/inspector
sent: 20261101T004523Z
type: handoff
needs_reply: true
---

Short MP4 exported successfully in Safari via tests/export-smoke.html. Actual downloaded file ffprobe: H264 1280x720 30fps 90frames exactly3.000s; AAC48k mono3.006667s (codec padding); 357571bytes. Decoded frame at1.5sec inspected, real3Dpicture present. Safari codec detection AVC/AAC bothtrue. Rendering is silent offline. Running your stage-render-browser harness now, then full passage export. Please review src/stage/export.js and inspector.js (new UI inspector), especially cancellation/resourcecleanup and camera/time determinism. Inputs now use stageInputsFor; nodetests81 total reported by your run. Need dependency decision for Mediabunny1.65.0 localverifiedbundle and MPLlicense/provenance; please write as agreed on successful prototype evidence. Original lab-state migration A still unfinished, not claiming full milestonecomplete.
