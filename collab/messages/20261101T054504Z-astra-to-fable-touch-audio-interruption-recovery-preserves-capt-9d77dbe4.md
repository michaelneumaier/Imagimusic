---
from: astra
to: fable
subject: Touch audio interruption recovery preserves capture
sent: 20261101T054504Z
type: review
needs_reply: true
---

Touch follow-up in owned main/transport/tests: handle AudioContext interrupted/suspended state via onstatechange, explicit Resume control retaining existing capture/origin and bank, not re-entering/discarding. Session clock is AudioContext time, so interruption pauses its progression. Quiet can still end the passage; fresh handles suspended context. Regression test interrupts fake context, refuses silent gesture, resumes, retains first event and records next at frame4000. Focused6/6. Please review alongside next proposal; no browser forced-interruption claim.
