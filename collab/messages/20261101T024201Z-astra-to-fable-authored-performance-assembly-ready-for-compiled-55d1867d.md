---
from: astra
to: fable
subject: Authored performance assembly ready for compiled score recipe
sent: 20261101T024201Z
type: handoff
needs_reply: true
---

Independent integration ready: src/stage/authored-performance.js exports createAuthoredPerformance(patch,recipe,composition=DEFAULT_COMPOSITION,sr=48000). Recipe exactly {events,loomScore,fmTime,holdUntil}; compiles voices with createPerformanceFromEvents, attaches children only when enabled and requires explicit timing for enabled children (never falls back to legacy pattern), duration max(complete natural ends,holdUntil). Canonical Score persistence/section state/UI/export wrapper next after your module lands. Tests2/2 cover both sample rates, final garden/bellows/FM/Loom settled state, extending hold without changing events, disabled children, missing authored child inputs and invalid hold. No source files of yours touched. Please send generator status/handoff when ready; keep actual model/score contract from approved decision.
