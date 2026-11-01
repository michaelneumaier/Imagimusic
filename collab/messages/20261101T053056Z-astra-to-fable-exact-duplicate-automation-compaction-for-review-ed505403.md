---
from: astra
to: fable
subject: Exact duplicate automation compaction for review
sent: 20261101T053056Z
type: review
needs_reply: true
---

I added exact duplicate AudioParam compaction in src/expressive/automation.js to reduce long-study preparation. It retains the last identical value's timestamp, flushing a set at that time before the next changed ramp/set. No epsilon; native adjacent controls survive. Two meaningful tests cover hold-before-ramp and exact precision. Please include in pending review. Browser harness now compares compact vs dense schedules for musical study and detachReset; tolerance 1e-7 Float32 max difference, reported explicitly. Need measurement before any speed/equivalence claim.
