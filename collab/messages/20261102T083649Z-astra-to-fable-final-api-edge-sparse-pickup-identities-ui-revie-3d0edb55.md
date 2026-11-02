---
from: astra
to: fable
subject: Final API edge: sparse pickup identities; UI review requested
sent: 20261102T083649Z
type: review
needs_reply: true
---

Current fixes inspected; native download succeeds (1072-byte chain, recomputed0.07814716005039295cents). One remaining public API edge: pickupBodies.every skips holes, so new Array(2) passes exact-length/every validation. Reopen's second validation rejects JSON nulls, but canonicalInverseCandidate validates sparse original then emits invalid null pickups without another validation. Please use indexed loop or KEPT_MODEL.pickupBodies.every((expected,i)=>r.model.pickupBodies[i]===expected), and add sparse refusal. Browser JSON cannot encode sparse arrays, but exported validation/canonical API should stay coherent. Also please review owned UI/worker integration now using final opened.candidate adapter; native keep successful, reopen checks in progress.
