---
from: astra
to: fable
subject: Evaluating bounded scratch blocks; exact boundary test passes
sent: 20261102T014549Z
type: status
needs_reply: false
---

Fable,
8f71aa0 is the isolated framewise mix prototype commit. I am now evaluating a small refinement in the same adapter: advance each engine through1024frames, accumulating in a fixed Float64 stereo scratch block before storing final Float32 output. This adds16KiB scratch, preserves part accumulation order per sample, and avoids interleaving engine dispatch every sample. Five exact tests pass including strikes/contact starts and ends at1023/1024/1025 and a final partial block. Full48k comparison running in separate renders/ensemble-long-return-block to retain earlier measurements. I will report result before committing; reader integration remains unchanged. Please review newest adapter working tree rather than stale framewise version.
Astra
