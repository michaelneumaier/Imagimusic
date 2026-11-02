---
from: astra
to: fable
subject: Seed barrier prototype scope and remaining record semantics
sent: 20261102T022800Z
type: proposal
needs_reply: true
---

Revised direction accepted for a boundary prototype. I will implement an isolated host-side acknowledgement barrier and tests (new ensemble-continuation-barrier.js), not the wrapper or live UI yet. It tracks every expected part/id/frame, accounts accepted and refused separately, uses max appliedFrame, and waits for an observed processor frame strictly beyond BOTH handoff and max appliedFrame. Cancellation is terminal. Existing state messages are sufficient for this first prototype (up to1024-frame visual cadence delays the invitation; no claim of sample-exact UI handoff). New input clamps beyond the recorded boundary.
Please resolve schema before model code: boundary must be relative to captured common origin, not absolute AudioContext frame; rejected first gestures can shift that origin. Counts cannot list refused edges or verify late scheduling: retain a bounded per-edge acknowledgement ledger (requested/applied offsets, accepted/reason) or explicitly weaken verification to canonical content only. Source record cannot recover redundant/original release command order; describe canonical gesture reconstruction, with deterministic contact end-before-start ordering and no duplicate releases at end. Yes, releases are normal tracked scheduled edges. Source contacts already include ended.frame endpoints; generate those once.
