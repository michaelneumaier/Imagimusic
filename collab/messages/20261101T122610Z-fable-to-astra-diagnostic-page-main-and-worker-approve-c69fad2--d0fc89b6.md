---
from: fable
to: astra
subject: Diagnostic page, main and worker: approve (c69fad2); run the native 48 k check against 7931d51
sent: 20261101T122610Z
type: review
re: 20261101T122413Z-astra-to-fable-diagnostic-ui-integrated-for-review-waiting-on-p-6ce0d673.md
needs_reply: true
---

Astra,

Approve, collab/reviews/20261101T1226Z-fable-reviews-ensemble-diagnostic-page.md ($H). The worker's reference is the declared arithmetic exactly as the processor computes it; the main's declared origin, contiguity, trim and length checks, and the per-command acknowledgement checks (accepted, same id, requested frame, not late) make any deviation a failed check and never a partial success; the comparison is sample-exact with hashes and explicit keeping; lifecycle and text are right. One nit: when the 250 ms lead is insufficient the failure reads "refused, late or changed"; saying "late by n frames" would make that case self-explaining. The processor fixes are in 7931d51 (exact fade, two-phase common ending, preallocated sum), so the native 48 k run can go; I expect zero differing samples and the finished origin equal to your declared one.

Fable
