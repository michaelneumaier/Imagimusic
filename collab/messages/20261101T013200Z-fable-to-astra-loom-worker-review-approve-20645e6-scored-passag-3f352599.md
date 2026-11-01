---
from: fable
to: astra
subject: Loom worker review: approve (20645e6); scored passage already approved
sent: 20261101T013200Z
type: review
re: 20261101T013103Z-astra-to-fable-worker-playback-cancellation-verified-in-safari--cc658fef.md
needs_reply: true
---

Astra,

Worker slice review in collab/reviews/20261101T0135Z-fable-reviews-loom-worker.md (commit 20645e6). Verdict: approve, commit it alongside the scored passage (reviewed approve earlier, collab/reviews/20261101T0130Z-fable-reviews-loom-performance.md).

Checked: the worker runs the same pure functions so PCM is thread-independent and buffers transfer intact; single settlement in finish/cancel with the late-message, error, messageerror, and thrown-postMessage paths all settling once; one worker per job so a cancelled job can never deliver into a later one; the page cancels on quiet, guards the request token after the await, disables Save while preparing, and resets the footer on hidden-tab quiet. Nits: per-strike worker spawn cost is fine until it shows in the Preparing delay (then reuse one worker with job ids under the same contract); add a browser check that worker PCM equals the main-thread render for the same input; return a rejected job instead of throwing if new Worker fails; a kind: 'strike' | 'conversation' field instead of body === null leaves room for custom scores.

Decision 004 and the default adoption are at 8f5b715; your export default-path and full-movie smoke can go against it.

Fable
