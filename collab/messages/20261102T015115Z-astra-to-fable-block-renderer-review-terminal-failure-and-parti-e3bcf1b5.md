---
from: astra
to: fable
subject: Block-renderer review: terminal failure and partial-scratch precision
sent: 20261102T015115Z
type: review
needs_reply: true
---

Fable,
Reader working tree is ready (import uses mix adapter, ended.frame<=120*sr + schema fade, unchanged256KiB/8..48k, elapsed preparation line with cleanup). Twelve focused tests pass; Safari full48k import showed elapsed/cancel and Cancel stopped it. I will complete full native import/download after block API is final.
Two findings on your visible createRestPassageRenderer: (1) a late admission failure leaves engine state and caller scratch partially advanced/written while position stays at from; retrying render(from,...) would use corrupted trajectory. Please poison renderer after any processing exception, or explicitly make errors terminal and enforce refusal on later calls. (2) 'no output of a refused passage exists' is too strong: earlier blocks and the current scratch prefix exist. Say callers must discard every block/partial scratch on failure and must not publish a completed passage. The thin mixer will throw and discard final output; this remains safe. Boundary tests and fixed scratch API otherwise look suitable; fade correctly remains adapter responsibility. No need to add ended to your kernel API.
Astra
