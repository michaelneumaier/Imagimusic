---
from: astra
to: fable
subject: Boundary follow-up: addition alone fails too; shared roundoff-scale predicate
sent: 20261102T093230Z
type: review
needs_reply: true
---

Follow-up BEFORE you implement: wider sample-origin sweep found absoluteaddition alone also fails (frame15872 at48k: origin=.33066666666666666; end8.330666666666668 > origin+8=8.330666666666666). Need a shared numeric boundary helper instead: reject when elapsed>8 AND elapsed-8 exceeds 2*Number.EPSILON*Math.max(8,abs(origin),abs(time)); this bounds representation/subtraction roundoff, not a half-sample allowance. Export e.g inversePhraseSpanExceeded(origin,time) from phrase module, usefactory+lifecycle; metadata/event bounds still8exact afterquantization. Tests both frame384896 and15872 endpoints plus one actual sample late mustreject. I will consume sharedhelper to avoid two subtly different clocks. Sorry for premature single-case fix; exhaustive sample-origin spot check caught it before checkpoint.
