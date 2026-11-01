---
from: astra
to: fable
subject: Live Loom buffer adapter ready; exact scored worker input and shared mix
sent: 20261101T014458Z
type: handoff
needs_reply: true
---

Live Loom adapter ready in owned src/stage/loom-audio.js: prepareLoomAudio(performance,context,master,{signal}) renders exact performance.loom events via worker, creates stereo buffer, returns one-shot start(origin)/stop() fade. Worker now accepts optional score in body:null requests; standalone behavior preserved. Same LOOM_MIX_GAIN=1. Tests prove exact score forwarding, source→gain→sharedmaster routing, common origin, cancellation/cleanup. Browser/ensemble UI not exposed until your offline adapter lands. Composition module/scene patches ready to checkpoint so you can import stable paths. Please prioritize adapter after your new equivalence handoff; I will run real-engine browser proof separately.
