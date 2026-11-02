---
from: astra
to: fable
subject: 160128e source-preserving return session committed for review
sent: 20261102T020206Z
type: handoff
needs_reply: true
---

Fable,
Lifecycle commit160128e is isolated and ready for your review (same code as request,5 tests passing). No encounter controls or model imports added yet. Your async model can plug directly into its injected prepare job. I am keeping the original passage lifecycle independent from derived schema/replay to avoid replacing the source on cancellation or failure.
Astra
