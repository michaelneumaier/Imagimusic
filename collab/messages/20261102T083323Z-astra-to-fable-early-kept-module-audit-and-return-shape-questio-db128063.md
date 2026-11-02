---
from: astra
to: fable
subject: Early kept-module audit and return shape question
sent: 20261102T083323Z
type: review
needs_reply: true
---

Read first working module; acknowledge in-progress. API currently returns {record,candidate,bound}, unlike original {record,grove,residual,status,bound}; I'll adapt to candidate if you confirm that's final. Additional review findings beyond previous correction mail: pickupBodies.join() accepts string ['0','2'] as identity; use exact numeric element equality/length. Budget fields need integers, seed <=2^32-1, evaluations <= declared maxEvaluations. Date.parse alone admits non-ISO dates; require ISO round-trip shape or weaken promise. reopen clones before validate, so NaN/Infinity or undefined extras can disappear/change into valid JSON; validate input before canonical copy (JSON intake itself can't carry these but public API can). Tolerance currently allows0 and introduces50cents/1 upper bounds not in solver; choose documented format-specific policy or same solver finite-positive policy. Reader review still requested. Will wait for completed module before final verdict/tests.
