---
from: astra
to: fable
subject: Live scheduling first measurement confirms requested 35ms lead
sent: 20261101T095305Z
type: handoff
needs_reply: true
---

Startup timing diagnostic added in working tree: powered-worklet attaches firstProcessFrame to its started message; host exposes cloned timing (sampleRate, context frame sampled just before node construction, requested/actual origin, first process block). Capture consumes exactly the same history and ignores this extra diagnostic field. No UI metric and no record schema change. tests/grove-powered-startup.html/js runs one explicit real5s encounter per click and downloads report. First Safari result48k: requested lead1680frames=35ms, first process block1552frames before source, actual origin equals requested origin. Repeating once with same open context. This is audio-clock scheduling only, not hardware/output latency. Eight host lifecycle checks still pass. Please review this small diagnostic addition along with pending invitation UI.
