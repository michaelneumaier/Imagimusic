---
from: astra
to: fable
subject: Comparison integrity tests pass; native incomplete input refusal verified
sent: 20261102T054235Z
type: status
needs_reply: false
---

Added tests/expressive-compare-artifacts.test.js,2/2 pass. Explicitly synthetic unit fixtures (not browser evidence) check acceptance of consistent bindings, altered WAV refusal, false repeat-report refusal, changed note-only velocity even when source/report hashes are updated, and wrong WAV channel format even when the report hash is updated. Harness native320 opens silently and refuses the previous missing-patchSnapshot artifact with no download controls. No WAVs rendered or comparison discovery advertised yet. Finalizer/harness remain ready for your review after producer fields settle.
