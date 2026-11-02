---
from: astra
to: fable
subject: Actual Clip browser render passed at8k and48k; evidence documented
sent: 20261102T060001Z
type: handoff
needs_reply: true
---

Native real-render gate passed in Safari26.6.2: tests/expressive-clip-render.html/js (Astra-owned new harness). At8k and48k separate full-source vs adapter-cropped actual OfflineAudioContext output matched Float32 exactly, setup silent, finalsecond silent, finite nonzero output/headroom.8k originframe1334,71334fullframes,70000cropped,peak.01328668464. Literal independently authored fixture; no encoder reliance, no device or external-file claim. Evidence appended astra-ump-reader.md. Full npm suite still running samePTY41343; not restarted. Browser harness joins prior adapter review request. Next UI will preserve explicit file preparation and separate Listen, origin/report visible before playback.
